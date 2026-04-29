import { type FormEvent, type ReactNode, useEffect, useRef, useState, useMemo } from "react";

import classNames from "classnames";

import {
    type StringFilterOperation,
    FilterOperation,
    stringFilterOperations,
    getFilterOperationLabel,
} from "../../../../common/models/FilterOperation";
import { type FolderFilter, EMPTY_FOLDER_FILTER } from "../../../../common/models/FolderFilter";
import { type TreeNode } from "../../../../common/models/TreeNode";
import { pluralize } from "../../../../common/utils";
import { FolderTreeView } from "../../../common/FolderTreeView/FolderTreeView";
import { TreeContainer } from "../../../common/TreeContainer/TreeContainer";
import { Dropdown } from "../../../library/Dropdown/Dropdown";
import { H3 } from "../../../library/Heading/Heading";
import { IconChevronDown } from "../../../library/icons/IconChevronDown";
import { IconRemove } from "../../../library/icons/IconRemove";
import { Popover, PopoverDirection } from "../../../library/Popover/Popover";
import { SegmentedControl } from "../../../library/SegmentedControl/SegmentedControl";
import { type TextInputHandle, TextInput } from "../../../library/TextInput/TextInput";
import { type Package } from "../../../models/Package";
import { getSelectedFolderCount } from "../../../treeUtils";
import { isValidRegex } from "../../../utils";

import classes from "./DropdownPath.module.css";

enum FilterOption {
    Folders = "folders",
    String = "string",
}

interface Props {
    className?: string;
    packages: Package[];
    label: string;
    folders: FolderFilter;
    operation?: StringFilterOperation;
    value?: string;
    placeholder?: string;
    open?: boolean;
    onFilterChange(operation: StringFilterOperation, value: string): void;
    onFoldersChange(folders: FolderFilter): void;
    onClose?(): void;
}

export function DropdownPath({
    className,
    packages,
    label,
    folders: initialFolders,
    operation: initialOperation = FilterOperation.Contains,
    value: initialValue = "",
    placeholder = "Type a text",
    open = false,
    onFilterChange,
    onFoldersChange,
    onClose,
}: Props) {
    const dropdownRef = useRef<HTMLButtonElement>(null);
    const inputRef = useRef<TextInputHandle>(null);

    const [isOpen, setIsOpen] = useState(open);
    const [isRendered, setIsRendered] = useState(false);
    const [filterOption, setFilterOption] = useState(initialValue === "" ? FilterOption.Folders : FilterOption.String);

    const [folders, setFolders] = useState<FolderFilter>(initialFolders);

    const [value, setValue] = useState(initialValue);
    const [operation, setOperation] = useState(initialOperation);
    const [hasError, setHasError] = useState(false);

    const stringOptions = stringFilterOperations.map(operation => ({
        value: operation,
        label: getFilterOperationLabel(operation),
    }));

    const initialSelectedFolderCount = useMemo(() => {
        return getSelectedFolderCount(packages, initialFolders);
    }, [packages, initialFolders]);

    const selectedFolderCount = useMemo(() => {
        return getSelectedFolderCount(packages, folders);
    }, [packages, folders]);

    function openOptions() {
        setIsOpen(true);
    }

    function closeOptions() {
        setIsOpen(false);
        onClose?.();
    }

    function handleFilterOptionChange(option: FilterOption) {
        setFilterOption(option);
    }

    function handleSelectionChange(node: TreeNode, isSelected: boolean) {
        const { selectedTreeNodes, deselectedTreeNodes } = folders;

        const newSelectedFolders = selectedTreeNodes.filter(selectedNode => !selectedNode.startsWith(node));
        const newDeselectedFolders = deselectedTreeNodes.filter(deselectedNode => !deselectedNode.startsWith(node));
        if (isSelected && !deselectedTreeNodes.some(deselectedNode => deselectedNode.equals(node))) {
            newSelectedFolders.push(node);
        } else if (!isSelected && !selectedTreeNodes.some(selectedTreeNode => selectedTreeNode.equals(node))) {
            newDeselectedFolders.push(node);
        }

        setFolders({
            selectedTreeNodes: newSelectedFolders,
            deselectedTreeNodes: newDeselectedFolders,
        });
    }

    function checkError(op: StringFilterOperation, val: string) {
        setHasError(op === FilterOperation.Regex && !isValidRegex(val.trim()));
    }

    function handleOperationChange(op: StringFilterOperation) {
        checkError(op, value);
        setOperation(op);

        inputRef.current?.focus();
    }

    function handleChange(val: string) {
        checkError(operation, val);
        setValue(val);
    }

    function handleFormSubmit(event: FormEvent) {
        event.preventDefault();

        handleSubmit();
    }

    function handleSubmit() {
        closeOptions();

        if (filterOption === FilterOption.Folders) {
            onFoldersChange(folders);
            return;
        }

        if (hasError) {
            setValue(initialValue);
            setOperation(initialOperation);
            checkError(initialOperation, initialValue);
        } else {
            onFilterChange(operation, value.trim());
        }
    }

    function handleCancel() {
        setValue(initialValue);
        setOperation(initialOperation);
        onFilterChange(initialOperation, initialValue);
        closeOptions();
    }

    function handleRemove() {
        if (filterOption === FilterOption.Folders) {
            onFoldersChange(EMPTY_FOLDER_FILTER);
            return;
        }

        onFilterChange(operation, "");
    }

    useEffect(() => {
        setIsRendered(dropdownRef.current !== null);
    }, [dropdownRef.current]);

    useEffect(() => {
        setFolders(initialFolders);
    }, [initialFolders]);

    useEffect(() => {
        setOperation(initialOperation);
    }, [initialOperation]);

    useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);

    function renderLabel() {
        if (!initialValue && initialSelectedFolderCount === 0) {
            return label;
        }

        let value: ReactNode = "";
        if (initialSelectedFolderCount !== 0) {
            value = `: ${pluralize("folder", initialSelectedFolderCount)}`;
        } else if (initialOperation === FilterOperation.Regex) {
            value = `: /${initialValue}/`;
        } else {
            value = <>{" "}<span className={classes.operation}>{getFilterOperationLabel(initialOperation)}</span> {initialValue}</>;
        }

        return (
            <span>
                {label}{value}
            </span>
        );
    }

    function renderFilterOptions() {
        if (filterOption === FilterOption.String) {
            return (
                <>
                    <H3>Enter path to filter by</H3>
                    <form className={classes.form} onSubmit={handleFormSubmit}>
                        <Dropdown
                            options={stringOptions}
                            value={operation}
                            optionsDirection={PopoverDirection.Vertical}
                            offset={0}
                            showValueInButton
                            hideChevron
                            onChange={handleOperationChange}/>
                        <TextInput
                            ref={inputRef}
                            className={classNames(classes.stringInput, { [classes.error]: hasError })}
                            value={value}
                            placeholder={operation === FilterOperation.Regex ? "Type a regex" : placeholder}
                            maxLength={100}
                            autoFocus
                            onChange={handleChange}
                            onCancel={handleCancel}/>
                        <input className={classes.hiddenInput} type="submit"/>
                    </form>
                </>
            );
        }

        const header = selectedFolderCount === 0
            ? "Select folders to filter by"
            : `${pluralize("folder", selectedFolderCount)} selected`;

        return (
            <TreeContainer header={header} withBackground={false}>
                <FolderTreeView
                    packages={packages}
                    folders={folders}
                    onSelectionChange={handleSelectionChange}/>
            </TreeContainer>
        );
    }

    const cls = classNames(classes.dropdownPath, className, {
        [classes.open]: isOpen,
    });

    return (
        <div className={classes.dropdownPathContainer}>
            <button
                ref={dropdownRef}
                className={cls}
                onClick={openOptions}>
                {renderLabel()}
                <IconChevronDown color="var(--label-secondary-color)"/>
                {isOpen && isRendered && (
                    <Popover
                        anchor={dropdownRef.current!}
                        className={classes.dropdownPathPopover}
                        direction={PopoverDirection.Vertical}
                        maxHeight={672}
                        onClose={handleSubmit}
                        onCancel={handleCancel}>
                        <SegmentedControl value={filterOption} onChange={handleFilterOptionChange}>
                            <SegmentedControl.Option value={FilterOption.Folders}>
                                Select folders
                            </SegmentedControl.Option>
                            <SegmentedControl.Option value={FilterOption.String}>
                                Enter manually
                            </SegmentedControl.Option>
                        </SegmentedControl>
                        {renderFilterOptions()}
                    </Popover>
                )}
            </button>
            {!isOpen && (
                <button className={classes.removeButton} onClick={handleRemove}>
                    <IconRemove/>
                </button>
            )}
        </div>
    );
}
