import type {
  ColumnDataSchemaModel,
  ColumnTemplateProp,
} from "@revolist/react-datagrid";

export const createAfterEditEventV2 = (
  props: ColumnTemplateProp | ColumnDataSchemaModel,
  newValue: any
) => {
  return new CustomEvent("afteredit", {
    bubbles: true,
    detail: {
      ...props,
      value: "",
      val: newValue,
    },
  });
};

export const saveCellValue = <T extends HTMLElement = HTMLElement>(
  props: ColumnTemplateProp | ColumnDataSchemaModel,
  containerRef: React.RefObject<T | null>,
  newValue: any
): boolean => {
  if (
    !props.data ||
    props.rowIndex === undefined ||
    !props.column?.columnName
  ) {
    return false;
  }

  const currentValue = props.data[props.rowIndex][props.column.columnName];

  if (currentValue !== newValue) {
    props.data[props.rowIndex][props.column.columnName] = newValue;
    const event = createAfterEditEventV2(props, newValue);
    containerRef.current?.dispatchEvent(event);
    return true;
  }

  return false;
};


