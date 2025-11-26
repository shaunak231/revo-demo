import { useEffect } from "react";
import type { FocusRenderEvent } from "@revolist/react-datagrid";
export function usePreventRangeSelection(
  gridRef: React.RefObject<HTMLRevoGridElement | null>
) {
  useEffect(() => {
    const grid = gridRef?.current;
    if (!grid) return;

    const handleBeforeApplyRange = (e: CustomEvent) => {
      const revoEvent = e.detail as FocusRenderEvent;
      if ((e.detail as any).custom) return;

      const rangeIncludesLastColumn =
        revoEvent.range.x1 === revoEvent.colDimension.count - 1;

      if (rangeIncludesLastColumn) {
        e.preventDefault();

        const newRange = {
          ...revoEvent.range,
          x1: revoEvent.range.x1 - 1,
        };

        const newEvent = new CustomEvent("beforeapplyrange", {
          detail: {
            ...revoEvent,
            range: newRange,
            custom: true,
          },
          bubbles: true,
          cancelable: false,
          composed: false,
        });
        grid.dispatchEvent(newEvent);
      }
    };

    grid.addEventListener("beforeapplyrange", handleBeforeApplyRange as any);
    return () => {
      grid.removeEventListener("beforeapplyrange", handleBeforeApplyRange as any);
    };
  }, [gridRef]);
}

export const useEnterKeyPressed = (
  colIndex: number | undefined,
  rowIndex: number | undefined,
  callback: (event?: KeyboardEvent) => void
) => {
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;

      if (
        e.key === "Enter" &&
        target.getAttribute("data-rgcol") === colIndex?.toString() &&
        target.getAttribute("data-rgrow") === rowIndex?.toString()
      ) {
        callback(e);
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [colIndex, rowIndex, callback]);
};


