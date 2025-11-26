import { MantineProvider, createTheme } from "@mantine/core";
import React, { useRef, useMemo, memo, useEffect } from "react";
import { RevoGrid, type ColumnRegular, Template } from "@revolist/react-datagrid";
import { CellDisplay } from "./CellDisplay";
import { ColHeader } from "./ColHeader";

const theme = createTheme({});

const withAllProviders = (Component: React.ComponentType<any>) => {
  const WrappedComponent = memo((props: any) => (
    <MantineProvider theme={theme} defaultColorScheme="light">
      <div data-provider-wrapper>
        <Component {...props} />
      </div>
    </MantineProvider>
  ));
  WrappedComponent.displayName = `WithAllProviders(${Component.displayName || Component.name || "Component"})`;
  return WrappedComponent;
};

const makeCellDisplayTemplate = (
  columnName: string,
  readonly: boolean,
  tableName: string,
  sqlSchema: any,
  hideOpenButton: boolean = false
) =>
  Template(withAllProviders(CellDisplay), {
    key: `${tableName}-${columnName}`,
    readonly,
    tableName,
    sqlSchema,
    hideOpenButton,
  });

const makeColHeaderTemplate = (
  isParserView: boolean,
  job: any,
  updateJobMutation: any,
  readonly: boolean
) =>
  Template(withAllProviders(ColHeader), {
    key: `colheader-${isParserView ? "parser" : "regular"}`,
    isParserView,
    job,
    updateJobMutation,
    readonly,
  });

interface TableProps {
  tableName: string;
  data: any[];
  columns: string[];
  sqlSchema?: any;
  readonly?: boolean;
}

export const Table: React.FC<TableProps> = ({
  tableName,
  data,
  columns,
  sqlSchema,
  readonly = false,
}) => {
  const gridRef = useRef<HTMLRevoGridElement>(null);

  const revoCols: ColumnRegular[] = useMemo(() => {
    const colHeaderTemplate = makeColHeaderTemplate(
      false,
      undefined,
      undefined,
      readonly
    );

    return columns.map((column): ColumnRegular => {
      const field = sqlSchema?.tables?.[tableName]?.fields?.[column];

      const cellTemplate = makeCellDisplayTemplate(
        column,
        readonly,
        tableName,
        sqlSchema,
        false
      );

      return {
        prop: column,
        name:
          field?.displayName ||
          column
            .replace(/_/g, " ")
            .replace(/\b\w/g, (char) => char.toUpperCase()),
        columnTemplate: colHeaderTemplate,
        cellTemplate: cellTemplate,
        size: column === "id" ? 70 : 200,
        editable: !readonly,
        tableName,
        columnName: column,
        sqlSchema: sqlSchema,
        readonly,
        columns: columns,
      };
    });
  }, [columns, tableName, sqlSchema, readonly]);

  const handleAfterEdit = (_e: CustomEvent) => {
  };

  useEffect(() => {
    if (gridRef.current) {
      (gridRef.current as any).headerRowHeight = 48;
    }
  }, []);

  useEffect(() => {
    console.log("🔄 Table rerendered", { tableName, columnsCount: columns.length, dataCount: data.length, readonly });
  });

  return (
    <div style={{ width: "100%", height: "600px" }}>
      <RevoGrid
        ref={gridRef}
        columns={revoCols}
        source={data}
        rowSize={36}
        readonly={readonly}
        range={!readonly}
        canFocus={!readonly}
        canMoveColumns={!readonly}
        onAfteredit={handleAfterEdit}
      />
    </div>
  );
};

export default Table;
