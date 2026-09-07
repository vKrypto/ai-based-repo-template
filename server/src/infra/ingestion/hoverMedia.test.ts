import { describe, it, expect } from "vitest";
import { chooseHoverMedia } from "./hoverMedia.js";

describe("chooseHoverMedia", () => {
  it("returns null (no second media) for variant ids divisible by 6", () => {
    expect(chooseHoverMedia(6)).toBeNull();
    expect(chooseHoverMedia(12)).toBeNull();
  });

  it("returns the video URL for the video-interval ids", () => {
    expect(chooseHoverMedia(4)).toEqual({
      url: "https://d3d5st4bexye3p.cloudfront.net/posts/6d14d7d2-0.mp4",
      mediaType: "video"
    });
  });

  it("returns the image URL for other ids", () => {
    expect(chooseHoverMedia(1)).toEqual({
      url: "https://ecommo--ion.bluenile.com/bn-main/refreshFJ.32c4b.jpg",
      mediaType: "image"
    });
  });

  it("is deterministic across calls", () => {
    expect(chooseHoverMedia(11)).toEqual(chooseHoverMedia(11));
  });
});
