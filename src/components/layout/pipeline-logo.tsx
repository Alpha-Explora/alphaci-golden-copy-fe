import Image from "next/image";

const LOGO_ASPECT_RATIO = 942 / 834;

export function PipelineLogo({ size = 28 }: { size?: number }) {
  const width = Math.round(size * LOGO_ASPECT_RATIO);

  return (
    <Image
      src="/alphaci-logo-blue-transparent-v3.png"
      alt=""
      aria-hidden="true"
      width={width}
      height={size}
      unoptimized
      style={{
        display: "block",
        width,
        height: size,
        objectFit: "contain",
      }}
    />
  );
}