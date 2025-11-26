import type {
  ColumnDataSchemaModel,
  ColumnTemplateProp,
} from "@revolist/react-datagrid";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { Badge } from "./Badge";
import { BADGE_COLORS } from "../utils/badge-colors";
import { saveCellValue } from "../hooks/table-events";

function CellBadge(props: ColumnTemplateProp | ColumnDataSchemaModel) {
  const displayValue = (props.value as string) || "";
  const readonly = props.column.readonly;
  const [isEditing, setIsEditing] = useState(false);
  const [position, setPosition] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const minHeight = 36;
  const heightBuffer = 2;
  const PORTAL_EXPANSION_PX = 2;

  useEffect(() => {
    console.log("🔄 CellBadge rerendered", {
      columnName: props.column.columnName,
      rowIndex: props.rowIndex,
      colIndex: props.colIndex,
      value: props.value,
      isEditing,
    });
  });

  const getBadgeColor = useCallback(() => {
    const colorKeys = Object.keys(BADGE_COLORS);
    return colorKeys[props.rowIndex % colorKeys.length];
  }, [props.rowIndex]);

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

  const handleSave = useCallback(() => {
    if (!textareaRef.current || !containerRef.current) return;

    const newValue = textareaRef.current.value.trim();
    saveCellValue(props as any, containerRef, newValue);
    setIsEditing(false);
    setPosition(null);
  }, [props]);

  const handleChange = () => {
    resizeTextarea();
  };

  const handleBlur = () => {
    handleSave();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
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
          <div className="flex h-full w-full min-h-[36px] items-start justify-start px-3 pt-3 pb-1.5">
            {displayValue ? (
              <Badge color={getBadgeColor()}>{displayValue}</Badge>
            ) : (
              <span className="text-stone-400 text-xs">Click to edit…</span>
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
            <textarea
              ref={textareaRef}
              defaultValue={displayValue}
              onChange={handleChange}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              className="block w-full max-w-full min-w-0 p-[6px_12px] text-xs font-medium leading-[1.8] border-[0.5px] border-blue-700 text-black font-[inherit] outline-none resize-none overflow-hidden bg-white cursor-text select-text box-border m-0 h-auto min-h-[36px] break-words whitespace-pre-wrap break-all"
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

export default CellBadge;

