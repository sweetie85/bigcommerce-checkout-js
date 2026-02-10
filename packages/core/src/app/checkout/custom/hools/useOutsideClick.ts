import { useEffect } from "react";

export function useOutsideClick(
  ref: React.RefObject<HTMLElement>,
  handler: () => void,
  active = true
) {
  useEffect(() => {
    if (!active) return;

    const listener = (event: MouseEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler();
    };

    document.addEventListener("mousedown", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
    };
  }, [ref, handler, active]);
}