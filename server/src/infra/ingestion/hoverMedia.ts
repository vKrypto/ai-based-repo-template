const HOVER_IMAGE_URL = "https://ecommo--ion.bluenile.com/bn-main/refreshFJ.32c4b.jpg";
const HOVER_VIDEO_URL = "https://d3d5st4bexye3p.cloudfront.net/posts/6d14d7d2-0.mp4";
const NO_SECOND_MEDIA_INTERVAL = 6;
const VIDEO_INTERVAL = 4;

export interface HoverMedia {
  url: string;
  mediaType: "image" | "video";
}

// chooseHoverMedia(1) -> { url: HOVER_IMAGE_URL, mediaType: "image" }
export function chooseHoverMedia(variantId: number): HoverMedia | null {
  if (variantId % NO_SECOND_MEDIA_INTERVAL === 0) {
    return null;
  }
  return variantId % VIDEO_INTERVAL === 0
    ? { url: HOVER_VIDEO_URL, mediaType: "video" }
    : { url: HOVER_IMAGE_URL, mediaType: "image" };
}
