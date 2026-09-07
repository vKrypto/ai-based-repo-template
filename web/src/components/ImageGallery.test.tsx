import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ImageGallery } from "./ImageGallery.js";

describe("ImageGallery", () => {
  it("marks a single image as full width", () => {
    const { container } = render(<ImageGallery images={["/a.jpg"]} name="Test Ring" />);
    expect(container.firstElementChild).toHaveAttribute("data-count", "1");
  });

  it("marks two images to keep their 50/50 layout", () => {
    const { container } = render(<ImageGallery images={["/a.jpg", "/b.jpg"]} name="Test Ring" />);
    expect(container.firstElementChild).toHaveAttribute("data-count", "2");
  });

  it("marks three or more images so they wrap onto additional rows", () => {
    const { container } = render(<ImageGallery images={["/a.jpg", "/b.jpg", "/c.jpg"]} name="Test Ring" />);
    expect(container.firstElementChild).toHaveAttribute("data-count", "3");
  });

  it("renders every image as its own grid tile", () => {
    render(<ImageGallery images={["/a.jpg", "/b.jpg", "/c.jpg"]} name="Test Ring" />);

    const images = screen.getAllByRole("img", { name: "Test Ring" });
    expect(images.map((image) => image.getAttribute("src"))).toEqual(["/a.jpg", "/b.jpg", "/c.jpg"]);
  });

  it("renders a single placeholder tile when there are no images", () => {
    render(<ImageGallery images={[]} name="Test Ring" />);

    const images = screen.getAllByRole("img", { name: "Test Ring" });
    expect(images).toHaveLength(1);
    expect(images[0]).toHaveAttribute("src", "/placeholder-product.svg");
  });

  it("zooms the hovered tile in and resets on mouse leave", () => {
    render(<ImageGallery images={["/a.jpg", "/b.jpg"]} name="Test Ring" />);
    const [firstImage] = screen.getAllByRole("img", { name: "Test Ring" });

    fireEvent.mouseEnter(firstImage!);
    expect(firstImage).toHaveStyle({ transform: "scale(2)" });

    fireEvent.mouseLeave(firstImage!);
    expect(firstImage).not.toHaveStyle({ transform: "scale(2)" });
  });

  it("falls back only the failed tile to the placeholder, leaving others untouched", () => {
    render(<ImageGallery images={["/a.jpg", "/b.jpg"]} name="Test Ring" />);
    const [firstImage, secondImage] = screen.getAllByRole("img", { name: "Test Ring" });

    fireEvent.error(firstImage!);

    expect(firstImage).toHaveAttribute("src", "/placeholder-product.svg");
    expect(secondImage).toHaveAttribute("src", "/b.jpg");
  });

  it("counts the video as a tile so a single image plus video keeps the 50/50 layout", () => {
    const { container } = render(<ImageGallery images={["/a.jpg"]} video="/clip.mp4" name="Test Ring" />);
    expect(container.firstElementChild).toHaveAttribute("data-count", "2");
  });

  it("renders the video deferred (preload=none) with the first image as its poster", () => {
    render(<ImageGallery images={["/a.jpg", "/b.jpg"]} video="/clip.mp4" name="Test Ring" />);

    const video = document.querySelector("video");
    expect(video).toHaveAttribute("preload", "none");
    expect(video).toHaveAttribute("poster", "/a.jpg");
    expect(video?.querySelector("source")).toHaveAttribute("src", "/clip.mp4");
  });

  it("plays the video on hover and pauses it back to the start on mouse leave", () => {
    render(<ImageGallery images={["/a.jpg"]} video="/clip.mp4" name="Test Ring" />);
    const video = document.querySelector("video")!;
    const playSpy = vi.spyOn(video, "play").mockImplementation(() => Promise.resolve());
    const pauseSpy = vi.spyOn(video, "pause").mockImplementation(() => undefined);

    fireEvent.mouseEnter(video.parentElement!);
    expect(playSpy).toHaveBeenCalled();

    fireEvent.mouseLeave(video.parentElement!);
    expect(pauseSpy).toHaveBeenCalled();
    expect(video.currentTime).toBe(0);
  });
});
