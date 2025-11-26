import type {
  ColumnDataSchemaModel,
  ColumnTemplateProp,
} from "@revolist/react-datagrid";
import React, { memo, useEffect } from "react";
import CellText from "./CellText";
import CellSelect from "./CellSelect";
import CellBadge from "./CellBadge";
import CellBoolean from "./CellBoolean";
import CellNumber from "./CellNumber";
enum FieldType {
  Text = "Text",
  LongText = "LongText",
  Number = "Number",
  Float = "Float",
  Date = "Date",
  Boolean = "Boolean",
  Url = "Url",
  Badge = "Badge",
  Progress = "Progress",
  SingleSelect = "SingleSelect",
  MultiSelect = "MultiSelect",
}

export const CellDisplay = (
  props: (ColumnTemplateProp | ColumnDataSchemaModel) & {
    hideOpenButton?: boolean;
  }
) => {
  useEffect(() => {
    console.log("🔄 CellDisplay rerendered", { 
      columnName: props.column.columnName, 
      rowIndex: props.rowIndex, 
      colIndex: props.colIndex,
      value: props.value 
    });
  });

  const tableName =
    props.column.tableName === "_document_metadata"
      ? "documents"
      : props.column.tableName;

  if (props.column.columnName === "id") {
    return (
      <div className="flex size-full items-center px-3 text-xs">
        {props.value || ""}
      </div>
    );
  }

  const sqlSchema = props.column.sqlSchema;
  const tableSchema = sqlSchema?.tables?.[tableName];
  let Component: React.ReactNode = null;

  if (sqlSchema && tableSchema) {
    const fields = tableSchema.fields;
    const field =
      fields[props.column.columnName] ||
      (props.column.isParserView && { type: FieldType.Text });

    if (field) {
      if (
        [FieldType.Text, FieldType.LongText].includes(field.type as FieldType)
      ) {
        Component = <CellText {...props} />;
      } else if (field.type === FieldType.Url) {
        Component = <CellText {...props} />;
      } else if (field.type === FieldType.Date) {
        Component = <CellText {...props} />;
      } else if (
        [FieldType.Number, FieldType.Float].includes(field.type as FieldType)
      ) {
        Component = <CellNumber {...props} />;
      } else if (field.type === FieldType.Badge) {
        Component = <CellBadge {...props} />;
      } else if (field.type === FieldType.Boolean) {
        Component = <CellBoolean {...props} />;
      } else if (field.type === FieldType.Progress) {
        Component = <CellText {...props} />;
      } else if (
        [FieldType.SingleSelect, FieldType.MultiSelect].includes(
          field.type as FieldType
        )
      ) {
        Component = (
          <CellSelect
            {...props}
            isMultiSelect={field.type === FieldType.MultiSelect}
          />
        );
      }
    } else {
      Component = <CellText {...props} />;
    }
  } else {
    Component = <CellText {...props} />;
  }

  return (
    <div className="group relative w-full h-full flex items-center">
      {Component}
    </div>
  );
};

export default memo(CellDisplay);
