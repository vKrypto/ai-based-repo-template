import "@testing-library/jest-dom/vitest";

if (typeof window.IntersectionObserver === "undefined") {
  class NoopIntersectionObserver implements IntersectionObserver {
    readonly root: Element | Document | null = null;
    readonly rootMargin: string = "";
    readonly thresholds: ReadonlyArray<number> = [];
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }

  window.IntersectionObserver = NoopIntersectionObserver as unknown as typeof IntersectionObserver;
}
