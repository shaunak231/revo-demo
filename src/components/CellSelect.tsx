import { ActionIcon, Popover, TextInput } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import type {
  ColumnDataSchemaModel,
  ColumnTemplateProp,
} from "@revolist/react-datagrid";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { twJoin } from "tailwind-merge";
import { LuX } from "react-icons/lu";

import { Badge } from "./Badge";
import { BADGE_COLORS } from "../utils/badge-colors";
import { saveCellValue } from "../hooks/table-events";
import { useCellEditing } from "../hooks/cell-editor";

type CellSelectProps =
  | ColumnTemplateProp
  | (ColumnDataSchemaModel & { isMultiSelect?: boolean });

function CellSelect(props: CellSelectProps) {
  const isMulti = !!(props as any).isMultiSelect;
  const [opened, { open, close }] = useDisclosure(false);
  const [inputValue, setInputValue] = useState("");
  
  const normalizeValue = (v: any): string[] => {
    if (v == null) return [];
    if (Array.isArray(v)) return v.map(String);
    if (typeof v === "string") return v.split(",").map((s) => s.trim()).filter(Boolean);
    return [String(v)];
  };
  
  const [selectedOptions, setSelectedOptions] = useState<string[]>(
    normalizeValue(props.value)
  );
  const targetRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { isEditing, setIsEditing, readonly, handleMouseDown } =
    useCellEditing(props as any);

  useEffect(() => {
    console.log("🔄 CellSelect rerendered", { 
      columnName: props.column.columnName, 
      rowIndex: props.rowIndex, 
      colIndex: props.colIndex,
      value: props.value,
      isEditing,
      isMulti,
      opened
    });
  });

  useEffect(() => {
    const newValue = normalizeValue(props.value);
    setSelectedOptions(newValue);
  }, [props.value]);

  const values: string[] = useMemo(() => {
    const dataValues = (props.data || []).reduce((acc: string[], curr: any) => {
      const value = curr?.[props.column.columnName];
      if (value) {
        const values = Array.isArray(value) ? value : [value];
        values.forEach((v) => {
          if (!acc.includes(String(v))) {
            acc.push(String(v));
          }
        });
      }
      return acc;
    }, [] as string[]);

    const safeSelectedOptions = Array.isArray(selectedOptions) ? selectedOptions : [];
    const combined = [...safeSelectedOptions, ...dataValues];
    return [...new Set(combined)];
  }, [props.data, props.column.columnName, selectedOptions]);

  const itemColorMap = useMemo(() => {
    const colorKeys = Object.keys(BADGE_COLORS);
    const colorMap: Record<string, string> = {};

    values.forEach((value, index) => {
      colorMap[value] = colorKeys[index % colorKeys.length] as string;
    });

    return colorMap;
  }, [values]);

  const getItemColor = useCallback(
    (item: string) => {
      return itemColorMap[item] || "gray";
    },
    [itemColorMap]
  );

  const options = useMemo(
    () =>
      values.filter((value) =>
        value.toLowerCase().includes(inputValue.toLowerCase())
      ),
    [values, inputValue]
  );

  const handleOpen = useCallback(
    (e?: React.MouseEvent) => {
      if (readonly) return;
      e?.stopPropagation();
      setIsEditing(true);
      open();
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    },
    [readonly, setIsEditing, open]
  );

  const handleClose = useCallback(() => {
    close();
    setIsEditing(false);
    setInputValue("");
  }, [close, setIsEditing]);

  const handleSave = useCallback(
    (value: string) => {
      if (!value.trim()) {
        handleClose();
        return;
      }

      const currentOptions = Array.isArray(selectedOptions) ? selectedOptions : [];
      let newValue: string[];

      if (isMulti) {
        if (currentOptions.includes(value)) {
          handleClose();
          return;
        }
        newValue = [...currentOptions, value];
      } else {
        newValue = [value];
      }

      if (saveCellValue(props as any, targetRef, isMulti ? newValue : newValue[0])) {
        setSelectedOptions(newValue);
      }

      handleClose();
    },
    [props, selectedOptions, handleClose, isMulti]
  );

  const handleDeleteOption = useCallback(
    (optionToDelete: string) => {
      const currentOptions = Array.isArray(selectedOptions) ? selectedOptions : [];
      const newSelectedOptions = currentOptions.filter(
        (option) => option !== optionToDelete
      );
      setSelectedOptions(newSelectedOptions);

      const newValue = isMulti ? newSelectedOptions : (newSelectedOptions[0] || null);
      saveCellValue(props as any, targetRef, newValue);
    },
    [props, selectedOptions, isMulti]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!isEditing) return;

      e.stopPropagation();

      if (e.key === "Enter") {
        e.preventDefault();
        if (inputValue.trim()) {
          handleSave(inputValue);
        }
        return;
      }

      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
        return;
      }
    },
    [isEditing, inputValue, handleSave, handleClose]
  );

  const handleCellClick = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest("button")) {
        return;
      }
      handleOpen(e);
    },
    [handleOpen]
  );

  return (
    <div
      ref={targetRef}
      className="size-full cursor-pointer"
      onMouseDown={handleMouseDown}
      onClick={handleCellClick}
    >
      <Popover
        opened={opened}
        width={260}
        position="bottom-start"
        offset={4}
        radius="sm"
        onDismiss={handleClose}
      >
        <Popover.Target>
          <div
            ref={contentRef}
            className={twJoin(
              "flex flex-wrap items-start gap-1.5 px-3 pb-1.5 w-full min-h-[36px] h-full",
              selectedOptions.length > 0 ? "pt-[7px]" : "pt-[7px]"
            )}
          >
            {!Array.isArray(selectedOptions) || selectedOptions.length === 0 ? (
              <span className="text-stone-400 text-xs">Select…</span>
            ) : (
              selectedOptions.slice(0, 3).map((selectedOption, index) => (
                <div key={`${selectedOption}-${index}`} className="relative">
                  <Badge
                    color={getItemColor(selectedOption)}
                    variant="filled"
                    radius="sm"
                  >
                    {selectedOption}
                  </Badge>
                </div>
              ))
            )}
            {Array.isArray(selectedOptions) && selectedOptions.length > 3 && (
              <span className="text-[11px] text-stone-500">
                … +{selectedOptions.length - 3} more
              </span>
            )}
          </div>
        </Popover.Target>
        <Popover.Dropdown className="ml-[-9px]">
          <div className="flex size-full flex-wrap items-center gap-x-2 gap-y-1 px-1">
            {Array.isArray(selectedOptions) && selectedOptions.map((selectedOption, index) => (
              <div key={`${selectedOption}-${index}`} className="relative">
                <Badge
                  color={getItemColor(selectedOption)}
                  variant="filled"
                  radius="sm"
                  rightSection={
                    <ActionIcon
                      className="size-3 border-none p-0"
                      variant="transparent"
                      size="xs"
                      color="red"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteOption(selectedOption);
                      }}
                      title="Remove option"
                    >
                      <LuX size={12} />
                    </ActionIcon>
                  }
                >
                  {selectedOption}
                </Badge>
              </div>
            ))}
            {isEditing && (
              <TextInput
                ref={inputRef}
                className="min-w-1 flex-1"
                classNames={{
                  input: "text-[13px]",
                }}
                variant="unstyled"
                size="xs"
                value={inputValue}
                onKeyDown={handleKeyDown}
                onFocus={() => !readonly && setIsEditing(true)}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => setInputValue(e.target.value)}
                styles={{
                  input: {
                    fontWeight: 500,
                    pointerEvents: "auto",
                    userSelect: "text",
                    cursor: isEditing ? "text" : "default",
                    caretColor: isEditing ? "auto" : "transparent",
                  },
                  wrapper: {
                    tabIndex: 0,
                  },
                }}
                readOnly={!isEditing}
              />
            )}
          </div>
          <div className="max-h-[120px] overflow-y-auto">
            {options.length > 0
              ? options.map((option, index) => (
                  <div
                    key={`${option}-${index}`}
                    className="flex cursor-pointer rounded-md px-2 py-1 hover:bg-stone-100"
                    onClick={() => handleSave(option)}
                  >
                    <Badge
                      color={getItemColor(option)}
                      variant="filled"
                      radius="sm"
                    >
                      {option}
                    </Badge>
                  </div>
                ))
              : inputValue.trim().length > 0 && (
                  <div
                    className="flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 hover:bg-stone-100"
                    onClick={() => handleSave(inputValue)}
                  >
                    <div className="text-xs">Create</div>
                    <Badge color="gray" variant="filled" radius="sm">
                      {inputValue}
                    </Badge>
                  </div>
                )}
          </div>
        </Popover.Dropdown>
      </Popover>
    </div>
  );
}

export default CellSelect;
