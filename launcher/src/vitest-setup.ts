import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

vi.mock("gsap", () => ({
  gsap: {
    context: (fn: () => void) => {
      fn();
      return { revert: () => {} };
    },
    to: () => ({}),
    set: () => {},
  },
}));

afterEach(() => {
  cleanup();
});
