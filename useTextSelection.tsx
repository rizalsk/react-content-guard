"use client";

import { useEffect } from "react";

export function useTextSelection(callback: (text: string) => void) {
  useEffect(() => {
    const handler = async (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      const selection = window.getSelection();
      const text = selection?.toString() ?? "";

      callback(text);

      setTimeout(async () => {
        try {
          await navigator.clipboard.writeText("");
          // eslint-disable-next-line
        } catch (err) {
          console.log("Clipboard clear blocked by browser");
        }
      }, 500);
      
    };

    const handlerCopy = (e: ClipboardEvent) => {
      e.preventDefault();

      e.clipboardData?.setData("text/plain", "");
    };

    document.addEventListener("selectionchange", handler);
    document.addEventListener("copy", handlerCopy);

    return () => {
      document.removeEventListener("selectionchange", handler);
      document.removeEventListener("copy", handlerCopy);
    };
  }, [callback]);

}