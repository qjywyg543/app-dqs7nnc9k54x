#!/usr/bin/env python3
"""宠物 Sprite 几何 QA 脚本。

基于 alpha 通道轻量检测每帧主体尺寸、bottom anchor、centerX，
并检测相邻帧与跨状态的 size popping、baseline jump、center shift、空帧、裁切、边缘越界。

示例：
    python3 geometry_qa.py \
        --config /path/to/sprites-config.json \
        --output-dir /path/to/public/images/pet \
        --report /path/to/geometry-report.json
"""

import argparse
import json
import math
from dataclasses import dataclass
from pathlib import Path

from PIL import Image


@dataclass
class FrameGeometry:
    state: str
    frame_index: int
    bbox: tuple[int, int, int, int]
    width: int
    height: int
    center_x: float
    bottom_anchor: float
    area: int
    anchor_x: float
    anchor_y: float


@dataclass
class Blocker:
    type: str
    severity: str
    message: str
    state: str | None
    frame_index: int | None


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Pet sprite geometry QA")
    parser.add_argument("--config", required=True, help="Path to sprites-config.json")
    parser.add_argument("--output-dir", required=True, help="Directory containing processed sprites")
    parser.add_argument("--report", required=True, help="Path to write geometry report JSON")
    parser.add_argument("--size-threshold", type=float, default=0.10, help="Height/width change threshold")
    parser.add_argument("--baseline-threshold", type=float, default=0.05, help="Baseline jump threshold")
    parser.add_argument("--center-threshold", type=float, default=0.05, help="Center shift threshold")
    return parser.parse_args()


def load_sprite_config(config_path: str) -> list[dict]:
    with open(config_path, "r", encoding="utf-8") as f:
        raw = json.load(f)
    if isinstance(raw, dict):
        return raw.get("states", [])
    return raw


def load_frame(img: Image.Image, frame_index: int, frame_width: int, frame_height: int) -> Image.Image:
    left = frame_index * frame_width
    return img.crop((left, 0, left + frame_width, frame_height))


def compute_frame_geometry(
    state: str,
    frame_index: int,
    frame: Image.Image,
    frame_width: int,
    frame_height: int,
    bottom_offset: int,
) -> FrameGeometry:
    bbox = frame.getbbox()
    if not bbox:
        return FrameGeometry(
            state=state,
            frame_index=frame_index,
            bbox=(0, 0, 0, 0),
            width=0,
            height=0,
            center_x=0,
            bottom_anchor=0,
            area=0,
            anchor_x=frame_width / 2,
            anchor_y=frame_height - bottom_offset,
        )

    l, t, r, b = bbox
    return FrameGeometry(
        state=state,
        frame_index=frame_index,
        bbox=bbox,
        width=r - l,
        height=b - t,
        center_x=(l + r) / 2,
        bottom_anchor=float(b),
        area=(r - l) * (b - t),
        anchor_x=frame_width / 2,
        anchor_y=frame_height - bottom_offset,
    )


def check_intra_state(frames: list[FrameGeometry], frame_height: int) -> list[Blocker]:
    blockers = []
    for i, g in enumerate(frames):
        if g.width == 0 or g.height == 0:
            blockers.append(Blocker(
                type="empty_frame",
                severity="blocker",
                message=f"第 {i} 帧为空帧",
                state=g.state,
                frame_index=i,
            ))
            continue

        if g.bbox[3] > frame_height:
            blockers.append(Blocker(
                type="edge_overflow",
                severity="blocker",
                message=f"第 {i} 帧主体超出 frame 下边界",
                state=g.state,
                frame_index=i,
            ))

        if i > 0:
            prev = frames[i - 1]
            if prev.height > 0:
                h_change = abs(g.height - prev.height) / prev.height
                if h_change > 0.10:
                    blockers.append(Blocker(
                        type="size_popping",
                        severity="warning",
                        message=f"第 {i-1} -> {i} 帧高度变化 {h_change:.1%}",
                        state=g.state,
                        frame_index=i,
                    ))

            baseline_change = abs(g.bottom_anchor - prev.bottom_anchor) / frame_height
            if baseline_change > 0.05:
                blockers.append(Blocker(
                    type="baseline_jump",
                    severity="warning",
                    message=f"第 {i-1} -> {i} 帧 baseline 变化 {baseline_change:.1%}",
                    state=g.state,
                    frame_index=i,
                ))

            if g.width > 0 and prev.width > 0:
                center_change = abs(g.center_x - prev.center_x) / max(g.width, prev.width)
                if center_change > 0.05:
                    blockers.append(Blocker(
                        type="center_shift",
                        severity="warning",
                        message=f"第 {i-1} -> {i} 帧 centerX 偏移 {center_change:.1%}",
                        state=g.state,
                        frame_index=i,
                    ))

    return blockers


def check_cross_state(state_frames: dict[str, list[FrameGeometry]], frame_width: int, frame_height: int) -> list[Blocker]:
    blockers = []
    states = list(state_frames.keys())
    if len(states) < 2:
        return blockers

    # 使用每个状态的稳定帧（第一帧）作为基准
    base_frames = {s: frames[0] for s, frames in state_frames.items() if frames}

    first_state = states[0]
    first = base_frames.get(first_state)
    if not first or first.height == 0:
        return blockers

    for s, frame in base_frames.items():
        if s == first_state or frame.height == 0:
            continue

        h_change = abs(frame.height - first.height) / first.height
        if h_change > 0.10:
            blockers.append(Blocker(
                type="cross_state_size_popping",
                severity="blocker",
                message=f"{first_state} -> {s} 主体高度变化 {h_change:.1%}",
                state=s,
                frame_index=0,
            ))

        baseline_change = abs(frame.bottom_anchor - first.bottom_anchor) / frame_height
        if baseline_change > 0.05:
            blockers.append(Blocker(
                type="cross_state_baseline_jump",
                severity="blocker",
                message=f"{first_state} -> {s} baseline 变化 {baseline_change:.1%}",
                state=s,
                frame_index=0,
            ))

        center_change = abs(frame.center_x - first.center_x) / frame_width
        if center_change > 0.05:
            blockers.append(Blocker(
                type="cross_state_center_shift",
                severity="blocker",
                message=f"{first_state} -> {s} centerX 偏移 {center_change:.1%}",
                state=s,
                frame_index=0,
            ))

        ratio = frame.width / frame.height if frame.height > 0 else 0
        first_ratio = first.width / first.height if first.height > 0 else 0
        if first_ratio > 0:
            ratio_change = abs(ratio - first_ratio) / first_ratio
            if ratio_change > 0.10:
                blockers.append(Blocker(
                    type="cross_state_silhouette_mismatch",
                    severity="blocker",
                    message=f"{first_state} -> {s} 轮廓宽高比变化 {ratio_change:.1%}",
                    state=s,
                    frame_index=0,
                ))

    return blockers


def main():
    args = parse_args()
    configs = load_sprite_config(args.config)
    output_dir = Path(args.output_dir)
    report_path = Path(args.report)
    report_path.parent.mkdir(parents=True, exist_ok=True)

    if not (output_dir / "pet-sprites.json").exists():
        print("pet-sprites.json not found, run process_sprites.py first")
        return

    with open(output_dir / "pet-sprites.json", "r", encoding="utf-8") as f:
        metadata = json.load(f)

    canonical = metadata.get("canonical", {})
    frame_width = canonical.get("frameWidth", 0)
    frame_height = canonical.get("frameHeight", 0)

    if frame_width == 0 or frame_height == 0:
        print("canonical frame spec missing, aborting")
        return

    state_frames: dict[str, list[FrameGeometry]] = {}
    all_blockers: list[Blocker] = []

    for cfg in configs:
        state = cfg["name"]
        sprite_path = output_dir / f"{state}.png"
        if not sprite_path.exists():
            continue

        img = Image.open(sprite_path)
        frame_count = cfg.get("frame_count", metadata.get(state, {}).get("frameCount", 0))
        bottom_offset = cfg.get("bottom_offset", 40)

        frames = []
        for i in range(frame_count):
            frame = load_frame(img, i, frame_width, frame_height)
            geo = compute_frame_geometry(state, i, frame, frame_width, frame_height, bottom_offset)
            frames.append(geo)

        state_frames[state] = frames
        all_blockers.extend(check_intra_state(frames, frame_height))

    all_blockers.extend(check_cross_state(state_frames, frame_width, frame_height))

    report = {
        "canonical": canonical,
        "states": {
            state: [
                {
                    "frameIndex": g.frame_index,
                    "bbox": g.bbox,
                    "width": g.width,
                    "height": g.height,
                    "centerX": g.center_x,
                    "bottomAnchor": g.bottom_anchor,
                    "area": g.area,
                }
                for g in frames
            ]
            for state, frames in state_frames.items()
        },
        "blockers": [
            {
                "type": b.type,
                "severity": b.severity,
                "message": b.message,
                "state": b.state,
                "frameIndex": b.frame_index,
            }
            for b in all_blockers
        ],
        "blockerCount": len([b for b in all_blockers if b.severity == "blocker"]),
        "warningCount": len([b for b in all_blockers if b.severity == "warning"]),
    }

    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    print(f"geometry report saved to {report_path}")
    print(f"blockers: {report['blockerCount']}, warnings: {report['warningCount']}")

    if report["blockerCount"] > 0:
        print("BLOCKERS DETECTED, do not proceed without fixing failed states")


if __name__ == "__main__":
    main()
