import { useMemo } from 'react';

interface WatermarkedImageProps {
  src: string;
  alt: string;
  text?: string;
  className?: string;
}

const GRID_SVG = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">` +
  `<text x="0" y="60" fill="rgba(0,0,0,0.18)" font-size="10" font-weight="bold" transform="rotate(-30, 0, 60)">` +
  `仅供实体店使用 盗用必究` +
  `</text></svg>`
);

export function WatermarkedImage({
  src,
  alt,
  text = '仅供实体店主微信：clx543（个人正常使用），一切盗用者追究其法律责任',
  className = '',
}: WatermarkedImageProps) {
  const watermark = useMemo(() => {
    return (
      <>
        <div
          className="pointer-events-none absolute inset-0 z-10 opacity-50 select-none"
          aria-hidden="true"
          style={{
            backgroundImage: `url("data:image/svg+xml,${GRID_SVG}")`,
            backgroundRepeat: 'repeat',
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-around overflow-hidden select-none"
          aria-hidden="true"
        >
          {Array.from({ length: 10 }).map((_, index) => (
            <div
              key={index}
              className="whitespace-nowrap text-[11px] font-extrabold tracking-widest text-foreground"
              style={{ transform: 'rotate(-25deg)' }}
            >
              {text}
            </div>
          ))}
        </div>
      </>
    );
  }, [text]);

  return (
    <div className={`relative select-none ${className}`}>
      <img
        src={src}
        alt={alt}
        draggable={false}
        className="h-full w-full rounded-lg border border-border object-contain"
      />
      {watermark}
    </div>
  );
}
