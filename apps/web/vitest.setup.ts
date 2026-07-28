import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";

afterEach(() => {
  cleanup();
});

// jsdom doesn't implement IntersectionObserver, which the `motion` library's
// `whileInView` feature (used by Reveal) needs to even mount without throwing.
class MockIntersectionObserver implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = "";
  readonly thresholds: ReadonlyArray<number> = [];
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}
globalThis.IntersectionObserver ??= MockIntersectionObserver;

// jsdom doesn't implement <dialog>'s showModal()/close() behavior. Polyfill
// just enough (toggling the `open` attribute + close event) for MobileNav's
// tests; real focus-trap/Escape behavior is native-browser-only and is
// verified manually in an actual browser instead.
if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
}

// jsdom does not implement matchMedia. Provide a default ("no reduced motion
// preference") so components using it don't crash; individual tests can
// still override window.matchMedia for reduced-motion-specific behavior.
if (!window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  });
}
