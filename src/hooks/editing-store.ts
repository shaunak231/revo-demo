import type {
  ColumnDataSchemaModel,
  ColumnTemplateProp,
} from "@revolist/react-datagrid";

type EditingState = {
  key: string;
  value: string;
};

type Listener = (state: EditingState | null) => void;

const listeners = new Set<Listener>();
let state: EditingState | null = null;

const notify = () => {
  listeners.forEach((listener) => listener(state));
};

export const editingStore = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  getState() {
    return state;
  },
  setActive(key: string, value: string) {
    state = { key, value };
    notify();
  },
  updateValue(key: string, value: string) {
    if (state?.key !== key) return;
    state = { key, value };
    notify();
  },
  clear(key?: string) {
    if (key && state?.key !== key) return;
    if (!key || state?.key === key) {
      state = null;
      notify();
    }
  },
};

export const getCellEditingKey = (
  props: ColumnTemplateProp | ColumnDataSchemaModel
) => {
  const table =
    props.column?.tableName ||
    props.column?.prop ||
    (props as any)?.tableName ||
    "table";
  const column =
    props.column?.columnName || props.column?.prop || props.prop || "column";
  const row =
    props.rowIndex !== undefined
      ? String(props.rowIndex)
      : String((props.model as any)?.id ?? "");

  return `${table}:${column}:${row}`;
};


