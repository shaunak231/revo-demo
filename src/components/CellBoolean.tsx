import { Checkbox } from "@mantine/core";
import type {
  ColumnDataSchemaModel,
  ColumnTemplateProp,
} from "@revolist/react-datagrid";
import { useCallback, useEffect, useRef } from "react";

import { useCellEditing } from "../hooks/cell-editor";
import { saveCellValue } from "../hooks/table-events";

function CellBoolean(props: ColumnTemplateProp | ColumnDataSchemaModel) {
  const targetRef = useRef<HTMLDivElement>(null);

  const { readonly, handleMouseDown } = useCellEditing(props as any);

  useEffect(() => {
    console.log("🔄 CellBoolean rerendered", { 
      columnName: props.column.columnName, 
      rowIndex: props.rowIndex, 
      colIndex: props.colIndex,
      value: props.value
    });
  });

  const currentValue =
    props.value === null || props.value === undefined
      ? false
      : Boolean(props.value);

  const handleToggle = useCallback(
    (checked: boolean) => {
      if (readonly) return;

      try {
        saveCellValue(props as any, targetRef, checked);
      } catch (error) {
        console.error("Error updating boolean value:", error);
      }
    },
    [readonly, props]
  );

  const handleCellClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if ((e.target as HTMLElement).closest("input[type='checkbox']")) {
        return;
      }

      if (readonly) return;
      e.stopPropagation();
      handleToggle(!currentValue);
    },
    [readonly, currentValue, handleToggle]
  );

  return (
    <div
      ref={targetRef}
      className="flex size-full cursor-pointer items-center justify-center px-3"
      onMouseDown={handleMouseDown}
      onClick={handleCellClick}
      tabIndex={0}
      data-rgcol={(props as any).colIndex}
      data-rgrow={(props as any).rowIndex}
    >
      <Checkbox
        checked={currentValue}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => handleToggle(event.currentTarget.checked)}
        disabled={readonly}
        color="stone.7"
        size="xs"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      />
    </div>
  );
}

export default CellBoolean;

