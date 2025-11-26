import type {
  ColumnDataSchemaModel,
  ColumnTemplateProp,
} from "@revolist/react-datagrid";
import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

import { createAfterEditEventV2 } from "../hooks/table-events";
import { useEnterKeyPressed } from "../hooks/table-hooks";

function CellText(props: ColumnTemplateProp | ColumnDataSchemaModel) {
  const displayValue = (props.value as string) || "";
  const readonly = props.column.readonly;
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    console.log("🔄 CellText rerendered", { 
      columnName: props.column.columnName, 
      rowIndex: props.rowIndex, 
      colIndex: props.colIndex,
      value: props.value,
      isEditing
    });
  });
  const [position, setPosition] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pendingPasteValueRef = useRef<string | null>(null);
  const skipEnterRef = useRef<boolean>(false);
  const minHeight = 36;
  const heightBuffer = 2;
  const PORTAL_EXPANSION_PX = 2;

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

  const resizeTextarea = useCallback(() => {
    if (!textareaRef.current || !wrapperRef.current) return;

    const textarea = textareaRef.current;
    textarea.style.height = "0px";
    const scrollHeight = textarea.scrollHeight;
    const newHeight =
      scrollHeight > minHeight ? scrollHeight + heightBuffer : minHeight;

    textarea.style.height = `${newHeight}px`;
    wrapperRef.current.style.height = `${newHeight}px`;
  }, [minHeight, heightBuffer]);

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

  useEffect(() => {
    if (isEditing && position && textareaRef.current && wrapperRef.current) {
      setTimeout(() => {
        const wrapperWidth = wrapperRef.current?.offsetWidth;
        if (wrapperWidth === 0) {
          textareaRef.current!.style.width = `${position.width}px`;
          textareaRef.current!.style.maxWidth = `${position.width}px`;
        } else {
          textareaRef.current!.style.width = "100%";
          textareaRef.current!.style.maxWidth = "100%";
        }
        textareaRef.current!.style.minWidth = "0";
        textareaRef.current!.style.boxSizing = "border-box";

        if (pendingPasteValueRef.current !== null && textareaRef.current) {
          textareaRef.current.value = pendingPasteValueRef.current;
          pendingPasteValueRef.current = null;
        }

        resizeTextarea();

        textareaRef.current?.focus();
        const len = textareaRef.current?.value.length || 0;
        textareaRef.current?.setSelectionRange(len, len);
      }, 0);
    }
  }, [isEditing, position, resizeTextarea]);

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

  useEffect(() => {
    if (readonly) {
      return;
    }

    const handleGlobalPaste = (event: ClipboardEvent) => {
      if (isEditing) {
        return;
      }

      const target = event.target as HTMLElement | null;
      const targetCol = target?.getAttribute("data-rgcol");
      const targetRow = target?.getAttribute("data-rgrow");
      if (
        targetCol !== props.colIndex?.toString() ||
        targetRow !== props.rowIndex?.toString()
      ) {
        return;
      }

      event.stopPropagation();
      event.preventDefault();

      const pastedText = event.clipboardData?.getData("text") ?? "";
      if (!pastedText) {
        return;
      }

      pendingPasteValueRef.current = pastedText;
      handleOpenEditor();
    };

    window.addEventListener("paste", handleGlobalPaste, true);
    return () => {
      window.removeEventListener("paste", handleGlobalPaste, true);
    };
  }, [handleOpenEditor, isEditing, props.colIndex, props.rowIndex, readonly]);

  const handleSave = useCallback(() => {
    if (!textareaRef.current || !containerRef.current) return;

    const newValue = textareaRef.current.value.trim();
    const currentValue = props.data[props.rowIndex][props.column.columnName];

    if (currentValue !== newValue) {
      props.data[props.rowIndex][props.column.columnName] = newValue;
      const event = createAfterEditEventV2(props, newValue);
      containerRef.current.dispatchEvent(event);
    }

    setIsEditing(false);
    setPosition(null);
  }, [props]);

  const handleChange = (_e: React.ChangeEvent<HTMLTextAreaElement>) => {
    resizeTextarea();
  };

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      e.stopPropagation();
      e.preventDefault();

      if (!textareaRef.current) return;

      const pastedText = e.clipboardData.getData("text");
      if (!pastedText) return;

      const textarea = textareaRef.current;
      const start = textarea.selectionStart ?? textarea.value.length;
      const end = textarea.selectionEnd ?? textarea.value.length;
      const currentValue = textarea.value;

      const newValue =
        currentValue.substring(0, start) +
        pastedText +
        currentValue.substring(end);

      textarea.value = newValue;

      setTimeout(() => {
        if (!textareaRef.current) {
          return;
        }
        const cursorPos = start + pastedText.length;
        textareaRef.current.setSelectionRange(cursorPos, cursorPos);
        resizeTextarea();
      }, 0);
    },
    [resizeTextarea]
  );

  const handleContainerPaste = useCallback(
    (e: React.ClipboardEvent<HTMLDivElement>) => {
      if (readonly || isEditing) {
        return;
      }

      e.stopPropagation();
      e.preventDefault();

      const pastedText = e.clipboardData.getData("text");
      if (!pastedText) {
        return;
      }

      pendingPasteValueRef.current = pastedText;
      handleOpenEditor();
    },
    [handleOpenEditor, isEditing, readonly]
  );

  const handleBlur = () => {
    setIsEditing(false);
    setPosition(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();

      skipEnterRef.current = true;

      setTimeout(() => {
        if (containerRef.current) {
          textareaRef.current?.blur();
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
        className="relative size-full min-h-[36px] w-full max-w-full overflow-hidden"
        onDoubleClick={handleOpenEditor}
        onClick={handleOpenEditor}
        onPaste={handleContainerPaste}
        tabIndex={0}
      >
        {isEditing ? (
          <div className="invisible h-0 overflow-hidden pointer-events-none">
            {displayValue || " "}
          </div>
        ) : (
          <div className="w-full max-w-full px-3 pt-2.5 pb-1.5 h-full flex items-start relative text-xs font-medium cursor-text overflow-hidden">
            {displayValue ? (
              <div className="w-full leading-[1.4] break-words line-clamp-2">
                {displayValue}
              </div>
            ) : null}
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
              width: `${position.width + PORTAL_EXPANSION_PX}px`,
              maxWidth: `${position.width + PORTAL_EXPANSION_PX}px`,
              minWidth: `${position.width + PORTAL_EXPANSION_PX}px`,
              minHeight: `${position.height + PORTAL_EXPANSION_PX * 2}px`,
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <textarea
              ref={textareaRef}
              defaultValue={displayValue}
              onChange={handleChange}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onPaste={handlePaste}
              className="block w-full max-w-full min-w-0 p-[6px_12px] text-xs font-medium leading-[1.8] border-[0.5px] border-blue-700 text-black font-[inherit] outline-none resize-none overflow-hidden overflow-x-hidden overflow-y-hidden bg-white cursor-text select-text box-border m-0 h-auto min-h-[36px] break-words whitespace-pre-wrap break-all"
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

export default CellText;

