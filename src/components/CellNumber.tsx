import type {
  ColumnDataSchemaModel,
  ColumnTemplateProp,
} from "@revolist/react-datagrid";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useRef, useState } from "react";

import { saveCellValue } from "../hooks/table-events";
import { useEnterKeyPressed } from "../hooks/table-hooks";

function CellNumber(props: ColumnTemplateProp | ColumnDataSchemaModel) {
  const getDisplayValue = useCallback(() => {
    if (props.value == null) return "";

    if (typeof props.value === "string") {
      return props.value;
    }

    const num = Number(props.value);
    if (isNaN(num)) return "";

    try {
      if (Number.isInteger(num)) {
        return num.toString();
      }

      const str = num.toString();
      if (!str.includes("e") && !str.includes("E")) {
        return str;
      }

      const fixed = num.toFixed(20);
      return fixed.replace(/\.?0+$/, "");
    } catch {
      return String(props.value);
    }
  }, [props.value]);

  const displayValue = getDisplayValue();
  const readonly = props.column.readonly;
  const contentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pendingPasteValueRef = useRef<string | null>(null);
  const skipEnterRef = useRef<boolean>(false);
  const [isEditing, setIsEditing] = useState(false);
  const [position, setPosition] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);
  const PORTAL_EXPANSION_PX = 2;

  useEffect(() => {
    console.log("🔄 CellNumber rerendered", {
      columnName: props.column.columnName,
      rowIndex: props.rowIndex,
      colIndex: props.colIndex,
      value: props.value,
      isEditing,
    });
  });

  const sanitizeNumericInput = useCallback((input: string): string => {
    let sanitized = input.replace(/[^\d.-]/g, "");

    const parts = sanitized.split(".");
    if (parts.length > 2) {
      sanitized = parts[0] + "." + parts.slice(1).join("");
    }

    if (sanitized.includes("-")) {
      const negativeIndex = sanitized.indexOf("-");
      if (negativeIndex !== 0) {
        sanitized = sanitized.replace(/-/g, "");
      } else {
        sanitized = "-" + sanitized.replace(/-/g, "");
      }
    }

    return sanitized;
  }, []);

  const transformValue = useCallback((value: string) => {
    return value === "" ? null : value;
  }, []);
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>): void => {
      const allowedKeys = [
        "Backspace",
        "Delete",
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        "Tab",
        "Home",
        "End",
        "Enter",
        "Escape",
      ];

      if (allowedKeys.includes(e.key)) {
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        return;
      }

      const isNumeric = /[\d.-]/.test(e.key);
      if (!isNumeric) {
        e.preventDefault();
        return;
      }
    },
    []
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.stopPropagation();
      e.preventDefault();

      const pastedText = e.clipboardData.getData("text");
      const input = e.currentTarget;

      if (!input || !pastedText) return;

      const start = input.selectionStart ?? 0;
      const end = input.selectionEnd ?? 0;
      const currentValue = input.value;

      const newValue =
        currentValue.substring(0, start) +
        pastedText +
        currentValue.substring(end);

      const sanitized = sanitizeNumericInput(newValue);
      input.value = sanitized;

      setTimeout(() => {
        const newCursorPos = Math.min(
          start + sanitized.length - currentValue.length,
          sanitized.length
        );
        input.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    },
    [sanitizeNumericInput]
  );

  const handleOpenEditor = useCallback(() => {
    if (readonly || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    setPosition({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    });
    setIsEditing(true);
  }, [readonly]);

  useEnterKeyPressed(props.colIndex, props.rowIndex, (event) => {
    if (readonly || isEditing) return;

    if (skipEnterRef.current) {
      skipEnterRef.current = false;
      if (event) {
        const target = event.target as HTMLElement;
        const arrowDownEvent = new KeyboardEvent("keydown", {
          key: "ArrowDown",
          code: "ArrowDown",
          keyCode: 40,
          which: 40,
          bubbles: true,
          cancelable: true,
        });
        target.dispatchEvent(arrowDownEvent);
      }
      return;
    }

    handleOpenEditor();
  });

  useEffect(() => {
    if (isEditing && position && inputRef.current && wrapperRef.current) {
      const inputElement = inputRef.current;
      const wrapperElement = wrapperRef.current;
      setTimeout(() => {
        if (!inputElement || !wrapperElement) return;

        const wrapperWidth = wrapperElement.offsetWidth;
        if (wrapperWidth === 0) {
          inputElement.style.width = `${position.width}px`;
          inputElement.style.maxWidth = `${position.width}px`;
        } else {
          inputElement.style.width = "100%";
          inputElement.style.maxWidth = "100%";
        }
        inputElement.style.minWidth = "0";
        inputElement.style.boxSizing = "border-box";

        if (pendingPasteValueRef.current !== null) {
          inputElement.value = sanitizeNumericInput(
            pendingPasteValueRef.current
          );
          pendingPasteValueRef.current = null;
        } else {
          inputElement.value = sanitizeNumericInput(displayValue);
        }

        inputElement.focus();
        inputElement.select();
      }, 0);
    }
  }, [displayValue, isEditing, position, sanitizeNumericInput]);

  useEffect(() => {
    if (!isEditing || !position) return;

    const updatePosition = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setPosition({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });
      }
    };

    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isEditing, position]);

  useEffect(() => {
    if (!isEditing) {
      pendingPasteValueRef.current = null;
    }
  }, [isEditing]);

  const handleSave = useCallback(() => {
    if (!inputRef.current || !containerRef.current) return;

    const newValue = transformValue(inputRef.current.value);
    saveCellValue(props as any, containerRef, newValue);
    setIsEditing(false);
    setPosition(null);
  }, [props, transformValue]);

  const handleBlur = () => {
    handleSave();
  };

  const handleKeyDownSave = (e: React.KeyboardEvent<HTMLInputElement>) => {
    handleKeyDown(e);
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();

      skipEnterRef.current = true;

      setTimeout(() => {
        if (containerRef.current) {
          inputRef.current?.blur();
          containerRef.current.focus();

          const arrowDownEvent = new KeyboardEvent("keydown", {
            key: "ArrowDown",
            code: "ArrowDown",
            keyCode: 40,
            which: 40,
            bubbles: true,
            cancelable: true,
          });
          containerRef.current.dispatchEvent(arrowDownEvent);
          skipEnterRef.current = false;
        } else {
          skipEnterRef.current = false;
        }
      }, 0);
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setPosition(null);
    }
    e.stopPropagation();
  };

  return (
    <>
      <div
        ref={containerRef}
        className="relative size-full min-h-[36px] w-full max-w-full overflow-hidden cursor-pointer"
        onDoubleClick={handleOpenEditor}
        onClick={handleOpenEditor}
        tabIndex={0}
        data-rgcol={(props as any).colIndex}
        data-rgrow={(props as any).rowIndex}
      >
        {isEditing ? (
          <div className="invisible h-0 overflow-hidden pointer-events-none">
            {displayValue || " "}
          </div>
        ) : (
          <div
            ref={contentRef}
            className="h-full w-full max-w-full px-3 text-xs font-medium overflow-hidden flex items-center"
          >
            {displayValue || (
              <span className="text-stone-400">Click to edit…</span>
            )}
          </div>
        )}
      </div>

      {isEditing &&
        position &&
        createPortal(
          <div
            ref={wrapperRef}
            className="fixed z-[10000] bg-white overflow-x-hidden overflow-y-visible h-auto"
            style={{
              top: `${position.top - PORTAL_EXPANSION_PX}px`,
              left: `${position.left - PORTAL_EXPANSION_PX}px`,
              width: `${position.width + PORTAL_EXPANSION_PX * 2}px`,
              maxWidth: `${position.width + PORTAL_EXPANSION_PX * 2}px`,
              minWidth: `${position.width + PORTAL_EXPANSION_PX * 2}px`,
              minHeight: `${position.height + PORTAL_EXPANSION_PX * 2}px`,
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <input
              ref={inputRef}
              type="text"
              onBlur={handleBlur}
              onKeyDown={handleKeyDownSave}
              onPaste={handlePaste}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              className="block w-full max-w-full min-w-0 p-[6px_12px] text-xs font-medium leading-[1.8] border-[0.5px] border-blue-700 text-black font-[inherit] outline-none bg-white cursor-text select-text box-border m-0 h-auto min-h-[36px]"
              style={{
                minHeight: `${position.height + PORTAL_EXPANSION_PX * 2}px`,
              }}
            />
          </div>,
          document.body
        )}
    </>
  );
}

export default CellNumber;

