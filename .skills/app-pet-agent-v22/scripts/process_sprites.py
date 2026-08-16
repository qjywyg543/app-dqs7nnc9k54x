#!/usr/bin/env python3
"""参数化宠物 Sprite Sheet 处理脚本（V2）。

V2 升级点：
- 建立统一的 canonical frame specification
- 所有状态使用共享 scale
- 使用 bottom-center anchor
- 输出 pet-sprites.json 包含 canonical 字段

支持通过 JSON 配置传入：
- 输入源文件路径
- 输出目录
- 状态名称、帧数、fps、loop
- 去背景、羽化、底部留白等参数

示例：
    python3 process_sprites.py \
        --config /workspace/app/tasks/pet/sprites-config.json \
        --output-dir /workspace/app/public/images/pet
"""

import argparse
import json
from dataclasses import dataclass
from pathlib import Path

from PIL import Image


@dataclass
class SpriteConfig:
    name: str
    source: str
    frame_count: int
    fps: float
    loop: bool
    bg_threshold: int = 35
    feather_band: int = 20
    bottom_offset: int = 40
    # 可选：针对单个状态源素材比例不一致时的显式归一化缩放（默认 1.0，即共享 scale）。
    # 仅用于修复某个状态源素材被生成为不同比例的情况，不是自动 fit-to-frame。
    scale: float = 1.0


@dataclass
class FrameGeometry:
    width: int
    height: int
    bbox: tuple[int, int, int, int]
    center_x: float
    bottom_anchor: float


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Process pet sprite sheets (V2)")
    parser.add_argument(
        "--config",
        required=True,
        help="Path to JSON config file describing sprites to process",
    )
    parser.add_argument(
        "--output-dir",
        required=True,
        help="Directory to write processed sprites and pet-sprites.json",
    )
    return parser.parse_args()


def load_config(config_path: str) -> list[SpriteConfig]:
    with open(config_path, "r", encoding="utf-8") as f:
        raw = json.load(f)

    if isinstance(raw, dict):
        raw = raw.get("states", [])

    configs = []
    for item in raw:
        configs.append(
            SpriteConfig(
                name=item["name"],
                source=item["source"],
                frame_count=item["frame_count"],
                fps=item.get("fps", 4.0),
                loop=item.get("loop", True),
                bg_threshold=item.get("bg_threshold", 35),
                feather_band=item.get("feather_band", 20),
                bottom_offset=item.get("bottom_offset", 40),
                scale=item.get("scale", 1.0),
            )
        )
    return configs


def estimate_background_color(img: Image.Image) -> tuple[int, int, int]:
    """采样四个角估计背景色。"""
    w, h = img.size
    sample_size = 12
    samples = []
    for x in (0, w - sample_size):
        for y in (0, h - sample_size):
            region = img.crop((x, y, x + sample_size, y + sample_size))
            samples.append(region.resize((1, 1)).getpixel((0, 0)))
    r = int(sum(c[0] for c in samples) / len(samples))
    g = int(sum(c[1] for c in samples) / len(samples))
    b = int(sum(c[2] for c in samples) / len(samples))
    return r, g, b


def remove_background(img: Image.Image, bg: tuple[int, int, int], threshold: int, feather: int) -> Image.Image:
    """将接近背景色的像素设为透明，并做羽化边缘。"""
    img = img.convert("RGBA")
    pixels = img.load()
    bg_r, bg_g, bg_b = bg
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = pixels[x, y]
            dist = ((r - bg_r) ** 2 + (g - bg_g) ** 2 + (b - bg_b) ** 2) ** 0.5
            if dist < threshold:
                pixels[x, y] = (r, g, b, 0)
            elif dist < threshold + feather:
                alpha = int((1 - (dist - threshold) / feather) * 255)
                pixels[x, y] = (r, g, b, alpha)
    return img


def find_content_columns(img: Image.Image) -> list[tuple[int, int]]:
    """根据 alpha 通道找出每个非透明内容列，返回各列段的 (start, end)。"""
    alpha = img.split()[-1]
    col_has_content = [any(alpha.getpixel((x, y)) > 10 for y in range(img.height)) for x in range(img.width)]
    segments = []
    start = None
    for i, has in enumerate(col_has_content):
        if has and start is None:
            start = i
        if not has and start is not None:
            segments.append((start, i))
            start = None
    if start is not None:
        segments.append((start, img.width))
    return segments


def crop_frame(img: Image.Image, left: int, right: int) -> Image.Image:
    """按内容区域裁剪出一帧，保留透明通道。"""
    frame = img.crop((left, 0, right, img.height))
    bbox = frame.getbbox()
    if bbox:
        return frame.crop(bbox)
    return frame


def extract_frames(img: Image.Image, cfg: SpriteConfig) -> list[Image.Image]:
    """从源图提取各帧透明 PNG。"""
    print(f"[{cfg.name}] source size: {img.size}")
    bg = estimate_background_color(img)
    transparent = remove_background(img, bg, cfg.bg_threshold, cfg.feather_band)

    segments = find_content_columns(transparent)
    print(f"[{cfg.name}] detected {len(segments)} content segments, expected {cfg.frame_count}")

    if len(segments) != cfg.frame_count:
        print(f"[{cfg.name}] fallback to equal width slicing")
        frame_w = img.width // cfg.frame_count
        segments = [(i * frame_w, (i + 1) * frame_w) for i in range(cfg.frame_count)]

    return [crop_frame(transparent, l, r) for l, r in segments]


def compute_frame_geometry(frame: Image.Image) -> FrameGeometry:
    """计算单帧的几何信息。"""
    bbox = frame.getbbox()
    if not bbox:
        return FrameGeometry(width=0, height=0, bbox=(0, 0, 0, 0), center_x=0, bottom_anchor=0)
    l, t, r, b = bbox
    width = r - l
    height = b - t
    center_x = (l + r) / 2
    return FrameGeometry(
        width=width,
        height=height,
        bbox=bbox,
        center_x=center_x,
        bottom_anchor=float(b),
    )


def build_canonical_frame_spec(
    all_frames: dict[str, list[Image.Image]],
    bottom_offset: int,
    padding_ratio: float = 0.05,
) -> dict:
    """根据所有帧的最大主体尺寸，建立统一的 canonical frame specification。"""
    geometries = {
        name: [compute_frame_geometry(f) for f in frames]
        for name, frames in all_frames.items()
    }

    max_width = max(g.width for gs in geometries.values() for g in gs)
    max_height = max(g.height for gs in geometries.values() for g in gs)

    # 加入少量 padding，避免裁切
    target_w = int(max_width * (1 + padding_ratio * 2))
    target_h = int(max_height * (1 + padding_ratio * 2)) + bottom_offset

    # 确保偶数，便于计算 anchor
    target_w = target_w + (target_w % 2)
    target_h = target_h + (target_h % 2)

    canonical_body_height = max_height
    canonical_scale = 1.0
    anchor_x = target_w // 2
    anchor_y = target_h - bottom_offset

    return {
        "frameWidth": target_w,
        "frameHeight": target_h,
        "anchor": "bottom-center",
        "anchorX": anchor_x,
        "anchorY": anchor_y,
        "bottomOffset": bottom_offset,
        "canonicalBodyHeight": canonical_body_height,
        "canonicalScale": canonical_scale,
    }


def build_sprite_sheet(
    name: str,
    frames: list[Image.Image],
    frame_spec: dict,
    bottom_offset: int,
    cfg_scale: float = 1.0,
) -> Image.Image:
    """将帧列表按统一 frame spec 拼成横向 sprite sheet。"""
    target_w = frame_spec["frameWidth"]
    target_h = frame_spec["frameHeight"]
    sheet = Image.new("RGBA", (target_w * len(frames), target_h), (0, 0, 0, 0))
    for i, f in enumerate(frames):
        # 可选的状态级归一化缩放（修复源素材比例不一致）
        if cfg_scale != 1.0 and f.width > 0 and f.height > 0:
            f = f.resize((int(f.width * cfg_scale), int(f.height * cfg_scale)), Image.LANCZOS)
        # 每帧在 sheet 中占据独立槽位，水平偏移 i * frameWidth
        x = i * target_w + (target_w - f.width) // 2
        # 底部对齐 anchorY（frame 已裁剪 bbox，bottom 即 f.height）
        anchor_y = target_h - bottom_offset
        y = anchor_y - f.height
        sheet.paste(f, (x, y), f)
    return sheet


def main():
    args = parse_args()
    configs = load_config(args.config)
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    all_frames: dict[str, list[Image.Image]] = {}

    for cfg in configs:
        src_path = Path(cfg.source)
        if not src_path.exists():
            print(f"Source not found, skipping: {src_path}")
            continue
        src = Image.open(src_path)
        all_frames[cfg.name] = extract_frames(src, cfg)

    if not all_frames:
        print("No frames extracted, aborting.")
        return

    # 使用第一个状态的 bottom_offset 作为默认，后续可扩展为每个状态独立
    bottom_offset = configs[0].bottom_offset
    canonical = build_canonical_frame_spec(all_frames, bottom_offset)
    target_w = canonical["frameWidth"]
    target_h = canonical["frameHeight"]
    print(f"[global] canonical frame size {target_w}x{target_h}")

    metadata: dict[str, dict] = {"canonical": canonical}
    for cfg in configs:
        if cfg.name not in all_frames:
            continue
        frames = all_frames[cfg.name]
        sheet = build_sprite_sheet(cfg.name, frames, canonical, cfg.bottom_offset, cfg.scale)
        output = output_dir / f"{cfg.name}.png"
        sheet.save(output, "PNG")
        print(f"[{cfg.name}] output {output}, frames={len(frames)}")
        metadata[cfg.name] = {
            "src": f"/images/pet/{cfg.name}.png",
            "frameCount": len(frames),
            "frameWidth": target_w,
            "frameHeight": target_h,
            "fps": cfg.fps,
            "loop": cfg.loop,
        }

    meta_path = output_dir / "pet-sprites.json"
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)
    print(f"metadata saved to {meta_path}")


if __name__ == "__main__":
    main()
