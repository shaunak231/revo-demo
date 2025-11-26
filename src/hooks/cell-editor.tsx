import type {
  ColumnDataSchemaModel,
  ColumnTemplateProp,
} from "@revolist/react-datagrid";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { createAfterEditEventV2 } from "./table-events";
import { useEnterKeyPressed } from "./table-hooks";
import { editingStore, getCellEditingKey } from "./editing-store";

export function useCellEditing(
  props: ColumnTemplateProp | ColumnDataSchemaModel,
  skipEnterRef?: React.MutableRefObject<boolean>
) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const readonly = props.column.readonly;
  const cellKey = useMemo(
    () => getCellEditingKey(props),
    [
      props.column?.columnName,
      props.column?.prop,
      props.column?.tableName,
      props.prop,
      props.rowIndex,
      (props.model as any)?.id,
    ]
  );
  const [isEditing, setIsEditingState] = useState(
    () => editingStore.getState()?.key === cellKey
  );

  const isSettingEditingRef = useRef(false);

  useEffect(() => {
    return editingStore.subscribe((state) => {
      if (isSettingEditingRef.current) {
        return;
      }
      setIsEditingState(state?.key === cellKey);
    });
  }, [cellKey]);

  const setIsEditing = useCallback(
    (next: boolean) => {
      isSettingEditingRef.current = true;

      setIsEditingState(next);

      if (next) {
        const columnName = props.column?.columnName ?? props.prop ?? "";
        const rowData =
          props.rowIndex !== undefined ? props.data?.[props.rowIndex] : undefined;
        const currentValue =
          (rowData ? (rowData as any)[columnName as any] : undefined) ??
          ref.current?.value ??
          "";
        editingStore.setActive(cellKey, String(currentValue ?? ""));
      } else {
        editingStore.clear(cellKey);
      }

      requestAnimationFrame(() => {
        setTimeout(() => {
          const currentState = editingStore.getState();
          if (next && currentState?.key === cellKey) {
            isSettingEditingRef.current = false;
          } else if (!next && !currentState) {
            isSettingEditingRef.current = false;
          } else {
            isSettingEditingRef.current = false;
          }
        }, 50);
      });

      setTimeout(() => {
        if (isSettingEditingRef.current) {
          isSettingEditingRef.current = false;
        }
      }, 200);
    },
    [cellKey, props.column?.columnName, props.prop, props.data, props.rowIndex]
  );

  useEnterKeyPressed(props.colIndex, props.rowIndex, (event) => {
    if (skipEnterRef?.current) {
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
    setIsEditing(true);
    setTimeout(() => {
      ref.current?.focus();
    }, 0);
  });

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (readonly) return;
    e.stopPropagation();
    setIsEditing(true);
    ref.current?.focus();
  };

  const handleBlur = () => {
    setIsEditing(false);
    handleChange();
  };

  const handleChange = () => {
    const currentValue = props.data[props.rowIndex][props.column.columnName];
    const newValue = ref.current?.value;

    if (currentValue !== newValue) {
      props.data[props.rowIndex][props.column.columnName] = newValue;
      ref.current?.dispatchEvent(createAfterEditEventV2(props, newValue));
    }
    ref.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (isEditing) {
      e.stopPropagation();
      if (["Enter", "Escape"].includes(e.key) && !e.shiftKey) {
        e.preventDefault();
        handleBlur();
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isEditing) {
      e.stopPropagation();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (isEditing) {
      e.stopPropagation();
    }
  };

  return {
    ref,
    isEditing,
    setIsEditing,
    readonly,
    handleDoubleClick,
    handleBlur,
    handleKeyDown,
    handleMouseDown,
    handlePaste,
  };
}


