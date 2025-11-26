import type { ColumnTemplateProp as BaseColumnTemplateProp } from "@revolist/react-datagrid";
import React, { useEffect } from "react";

interface ColumnTemplateProp extends BaseColumnTemplateProp {
  isParserView?: boolean;
  job?: any;
  updateJobMutation?: any;
  readonly?: boolean;
}

const ColHeader = (props: ColumnTemplateProp) => {
  const isIdColumn = props.columnName === "id";

  useEffect(() => {
    console.log("🔄 ColHeader rerendered", { columnName: props.columnName, name: props.name, readonly: props.readonly });
  });

  return (
    <div 
      className="group flex h-full w-full transition-colors hover:bg-stone-100"
      style={{ 
        height: '100%', 
        minHeight: '48px',
        overflow: 'visible',
        display: 'flex',
        alignItems: 'center'
      }}
    >
      <div 
        className="flex flex-1 items-center gap-2 pl-3.5 h-full"
        style={{ 
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          overflow: 'visible'
        }}
      >
        {!isIdColumn && (
          <p 
            className="flex-1 truncate text-left text-[12px] font-normal text-stone-700"
            style={{ 
              lineHeight: '1.5',
              margin: 0,
              padding: 0,
              overflow: 'visible'
            }}
          >
            {props.name}
          </p>
        )}
      </div>
    </div>
  );
};

export { ColHeader };
export default React.memo(ColHeader);
