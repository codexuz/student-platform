"use client";

import { useEffect } from "react";

/**
 * Warns the user before they leave or reload the page (e.g. accidental F5,
 * tab close, or browser back/forward) so in-progress test answers aren't lost.
 *
 * Uses the browser `beforeunload` event, which covers reload, tab close, and
 * hard navigation away from the app. The confirmation text is controlled by the
 * browser — custom messages are not shown in modern browsers.
 *
 * @param enabled When true, the guard is active. Pass the test's "in progress"
 *   state so the prompt only appears while there's something to lose.
 */
export function usePreventPageLeave(enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Required for Chrome/Edge to trigger the native confirmation dialog.
      e.returnValue = "";
      return "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [enabled]);
}

export default usePreventPageLeave;
