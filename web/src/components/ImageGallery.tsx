import { useRef, useState, type MouseEvent, type ReactElement, type SyntheticEvent } from "react";
import styles from "./ImageGallery.module.css";

const PLACEHOLDER_IMAGE = "/placeholder-product.svg";

interface GalleryTileProps {
  src: string;
  alt: string;
}

function GalleryTile({ src, alt }: GalleryTileProps): ReactElement {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [isZoomed, setIsZoomed] = useState(false);
  const [transformOrigin, setTransformOrigin] = useState("center");

  function handleMouseMove(event: MouseEvent<HTMLDivElement>): void {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - bounds.top) / bounds.height) * 100;
    setTransformOrigin(`${x}% ${y}%`);
  }

  function handleImageError(_event: SyntheticEvent<HTMLImageElement>): void {
    setCurrentSrc(PLACEHOLDER_IMAGE);
  }

  return (
    <div
      className={styles.tile}
      onMouseEnter={() => setIsZoomed(true)}
      onMouseLeave={() => setIsZoomed(false)}
      onMouseMove={handleMouseMove}
    >
      <img
        src={currentSrc}
        alt={alt}
        loading="lazy"
        onError={handleImageError}
        style={isZoomed ? { transform: "scale(2)", transformOrigin } : undefined}
      />
    </div>
  );
}

function suppressPlaybackError(action: () => void): void {
  try {
    action();
  } catch {
    // media playback is unavailable (e.g. jsdom in tests); ignore
  }
}

interface VideoTileProps {
  src: string;
  poster: string;
}

function VideoTile({ src, poster }: VideoTileProps): ReactElement {
  const videoRef = useRef<HTMLVideoElement>(null);

  function handleMouseEnter(): void {
    suppressPlaybackError(() => {
      videoRef.current?.play()?.catch(() => undefined);
    });
  }

  function handleMouseLeave(): void {
    suppressPlaybackError(() => {
      const video = videoRef.current;
      if (!video) return;
      video.pause();
      video.currentTime = 0;
    });
  }

  return (
    <div className={styles.tile} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <video ref={videoRef} poster={poster} muted loop playsInline preload="none">
        <source src={src} type="video/mp4" />
      </video>
    </div>
  );
}

interface ImageGalleryProps {
  images: string[];
  video?: string | null;
  name: string;
}

export function ImageGallery({ images, video, name }: ImageGalleryProps): ReactElement {
  const displayImages = images.length > 0 ? images : [PLACEHOLDER_IMAGE];
  const tileCount = displayImages.length + (video ? 1 : 0);

  return (
    <div className={styles.grid} data-count={tileCount}>
      {displayImages.map((src, index) => (
        <GalleryTile key={src + index} src={src} alt={name} />
      ))}
      {video && <VideoTile src={video} poster={displayImages[0]!} />}
    </div>
  );
}
