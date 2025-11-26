import type {
  ColumnDataSchemaModel,
  ColumnTemplateProp,
} from "@revolist/react-datagrid";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { saveCellValue } from "../hooks/table-events";
import { useCellEditing } from "../hooks/cell-editor";

type CellSelectProps =
  | ColumnTemplateProp
  | (ColumnDataSchemaModel & { isMultiSelect?: boolean });

function CellSelect(props: CellSelectProps) {
  const isMulti = !!(props as any).isMultiSelect;
  const { isEditing, setIsEditing, readonly, handleMouseDown } =
    useCellEditing(props as any);

  useEffect(() => {
    console.log("🔄 CellSelect rerendered", { 
      columnName: props.column.columnName, 
      rowIndex: props.rowIndex, 
      colIndex: props.colIndex,
      value: props.value,
      isEditing,
      isMulti
    });
  });

  const selectedValues = useMemo(() => {
    const v = props.value;
    if (v == null) return [] as string[];
    if (Array.isArray(v)) return v.map(String);
    if (typeof v === "string") {
      return v
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return [String(v)];
  }, [props.value]);

  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const PORTAL_EXPANSION_PX = 2;

  const options = useMemo(() => {
    const values = new Set<string>();
    if (Array.isArray(props.data)) {
      for (const row of props.data as any[]) {
        const cellVal = row?.[props.column.columnName];
        if (cellVal == null) continue;
        if (Array.isArray(cellVal)) {
          cellVal.forEach((v) => values.add(String(v)));
        } else if (typeof cellVal === "string") {
          values.add(cellVal);
        } else {
          values.add(String(cellVal));
        }
      }
    }
    selectedValues.forEach((v) => values.add(v));
    return Array.from(values);
  }, [props.data, props.column.columnName, selectedValues]);

  const label = useMemo(() => {
    if (!selectedValues.length) return "";
    return isMulti ? selectedValues.join(", ") : selectedValues[0];
  }, [selectedValues, isMulti]);

  const openDropdown = useCallback(() => {
    if (readonly || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setPosition({
      top: rect.bottom,
      left: rect.left,
      width: rect.width,
    });
    setIsEditing(true);
    setIsOpen(true);
  }, [readonly, setIsEditing]);

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    setIsEditing(false);
  }, [setIsEditing]);

  const saveValue = useCallback(
    (valuesToSave: string[]) => {
      if (!containerRef.current) return;

      const newValue = isMulti
        ? valuesToSave
        : valuesToSave.length
        ? valuesToSave[0]
        : null;

      saveCellValue(props as any, containerRef, newValue);
      closeDropdown();
    },
    [closeDropdown, isMulti, props]
  );

  const handleOptionClick = (option: string) => {
    if (isMulti) {
      const exists = selectedValues.includes(option);
      const next = exists
        ? selectedValues.filter((v) => v !== option)
        : [...selectedValues, option];
      saveValue(next);
    } else {
      saveValue([option]);
    }
  };

  const handleClear = () => {
    saveValue([]);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeDropdown();
      }
    };

    const handleClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        closeDropdown();
      }
    };

    window.addEventListener("keydown", handleKey);
    window.addEventListener("mousedown", handleClick);
    return () => {
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("mousedown", handleClick);
    };
  }, [isOpen, closeDropdown]);

  return (
    <>
      <div
        ref={containerRef}
        className="relative size-full min-h-[36px] w-full max-w-full overflow-hidden cursor-pointer"
        onClick={() => !readonly && openDropdown()}
        tabIndex={0}
        data-rgcol={(props as any).colIndex}
        data-rgrow={(props as any).rowIndex}
        onMouseDown={handleMouseDown}
      >
        <div className="h-full w-full max-w-full px-3 text-xs font-medium overflow-hidden flex items-center">
          {label || <span className="text-stone-400">Select…</span>}
        </div>
      </div>

      {isOpen &&
        position &&
        createPortal(
          <div
            className="fixed z-[10000] bg-white border border-stone-300 rounded shadow-sm text-xs"
            style={{
              top: position.top + PORTAL_EXPANSION_PX,
              left: position.left - PORTAL_EXPANSION_PX,
              minWidth: position.width + PORTAL_EXPANSION_PX * 2,
              maxWidth: position.width + PORTAL_EXPANSION_PX * 2,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="max-h-64 overflow-auto">
              {options.length === 0 && (
                <div className="px-3 py-2 text-stone-500">
                  No options (add values in this column to see them here)
                </div>
              )}
              {options.map((option) => {
                const selected = selectedValues.includes(option);
                return (
                  <button
                    key={option}
                    type="button"
                    className={`flex w-full items-center px-3 py-1.5 text-left hover:bg-stone-100 ${
                      selected ? "bg-stone-100 font-semibold" : ""
                    }`}
                    onClick={() => handleOptionClick(option)}
                  >
                    {isMulti && (
                      <span className="mr-2 text-[10px]">
                        {selected ? "☑" : "☐"}
                      </span>
                    )}
                    <span>{option}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex justify-between border-t border-stone-200 px-3 py-1.5">
              <button
                type="button"
                className="text-[11px] text-stone-500 hover:text-stone-800"
                onClick={handleClear}
              >
                Clear
              </button>
              <button
                type="button"
                className="text-[11px] text-stone-500 hover:text-stone-800"
                onClick={closeDropdown}
              >
                Close
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

export default CellSelect;


