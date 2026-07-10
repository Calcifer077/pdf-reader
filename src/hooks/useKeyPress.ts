import { useEffect } from "react";

/**
 * Calls `handler` whenever `key` is pressed (e.g. "Escape", "Enter").
 * Pass `active = false` to disable the listener (e.g. when a modal is closed).
 */
export function useKeyPress(
  key: string,
  handler: (event: KeyboardEvent) => void,
  active: boolean = true,
) {
  useEffect(() => {
    // the modal is not even visible
    if (!active) return;

    // listening for the key that was asked by the hook user
    const listener = (event: KeyboardEvent) => {
      if (event.key === key) handler(event);
    };

    window.addEventListener("keydown", listener);

    // cleanup function
    return () => window.removeEventListener("keydown", listener);
  }, [key, handler, active]);
}
