import { type FormEvent, useEffect, useState } from "react";

import { DateOption } from "../../../../../../common/models/DateOption";
import { type Filter, type RegularFilter, getFilterDataType, getValidFilterTypeOperations, valueIntoNumber, valueIntoString } from "../../../../../../common/models/Filter";
import { type FilterDataType } from "../../../../../../common/models/FilterDataType";
import { getFilterOperationLabel, FilterOperation } from "../../../../../../common/models/FilterOperation";
import { getFilterTypeLabel, FilterType } from "../../../../../../common/models/FilterType";
import { type Project } from "../../../../../../common/models/Project";
import { type Tag, RESERVED_TAGS } from "../../../../../../common/models/Tag";
import { getLatestAnalysisComponents } from "../../../../../api/api";
import { type DropdownOption } from "../../../../../library/Dropdown/DropdownOption";
import { IconArrow } from "../../../../../library/icons/IconArrow";
import { IconRemove } from "../../../../../library/icons/IconRemove";
import { NumberInput } from "../../../../../library/NumberInput/NumberInput";
import { TextInput } from "../../../../../library/TextInput/TextInput";
import { Tooltip } from "../../../../../library/Tooltip/Tooltip";
import { SortType } from "../../../../../models/SortType";
import { useStore } from "../../../../../providers/StoreProvider/StoreProvider";
import { WidgetDate } from "../../widgetDate/WidgetDate";
import { WidgetDropdown } from "../../widgetDropdown/WidgetDropdown";
import { WidgetDropdownMulti } from "../../widgetDropdownMulti/WidgetDropdownMulti";

import classes from "./FilterCell.module.css";

function getProjectOption(project: Project): DropdownOption<string> {
    return {
        value: project.packageName,
        label: project.alias ?? project.packageName,
    };
}

function getTagOption(tag: Tag): DropdownOption<string> {
    return {
        value: tag.slug,
        label: tag.name,
    };
}

function getFilterTypeOption(filterType: FilterType): DropdownOption<FilterType> {
    return {
        value: filterType,
        label: getFilterTypeLabel(filterType),
    };
}

function getFilterOperationOption(filterOperation: FilterOperation, dataType: FilterDataType): DropdownOption<FilterOperation> {
    return {
        value: filterOperation,
        label: getFilterOperationLabel(filterOperation, dataType),
    };
}

function getDefaultOperation(filterType: FilterType): FilterOperation {
    switch (filterType) {
        case FilterType.ProjectDefined:
        case FilterType.ProjectUsedIn:
        case FilterType.Tag:
        case FilterType.Name:
            return FilterOperation.Equals;
        case FilterType.FilePath:
            return FilterOperation.Contains;
        case FilterType.CreatedDate:
        case FilterType.LastUpdatedDate:
        case FilterType.LastUsageChangedDate:
            return FilterOperation.Between;
        case FilterType.NumberOfUsages:
        case FilterType.NumberOfDependencies:
            return FilterOperation.GreaterThan;
        case FilterType.CustomProperty:
            return FilterOperation.Equals;
    }
}

function getDefaultValue(filterType: FilterType): string[] | undefined {
    switch (filterType) {
        case FilterType.CreatedDate:
        case FilterType.LastUpdatedDate:
        case FilterType.LastUsageChangedDate:
            return ["", DateOption.Today];
        default:
            return undefined;
    }
}

interface Props {
    index: number;
    type?: FilterType;
    operation?: FilterOperation;
    value?: string[];
    disabled?: boolean;
    onSetFilter(filter: Partial<Filter>, index: number): void;
    onRemoveFilter(index: number): void;
}

interface DropdownProps {
    options: DropdownOption<string>[];
    emptyText: string;
    loading: boolean;
}

export function FilterCell({
    index,
    type,
    operation,
    value: initialValue,
    disabled = false,
    onSetFilter,
    onRemoveFilter,
}: Props) {
    const [value, setValue] = useState(initialValue ?? []);
    const [dropdownProps, setDropdownProps] = useState<DropdownProps>({
        options: [],
        loading: false,
        emptyText: "",
    });
    const { selectors: { getWorkspace, getTags } } = useStore();

    const workspace = getWorkspace()!;
    const projects = workspace.projects;
    const tags = [...getTags(), RESERVED_TAGS.UNTAGGED];

    const projectOptions = [...projects.map(getProjectOption)];
    const internalProjectOptions = [...projects.filter(({ isInternal }) => isInternal).map(getProjectOption)];
    const tagOptions = [...tags.map(getTagOption)];
    const typeOptions = Object.values(FilterType).filter(type => type !== FilterType.CustomProperty).map(getFilterTypeOption);

    function getDefaultOptions() {
        if (type === FilterType.ProjectDefined) {
            return projectOptions;
        }
        if (type === FilterType.ProjectUsedIn) {
            return internalProjectOptions;
        }
        if (type === FilterType.Tag) {
            return tagOptions;
        }
        if (type === FilterType.Name) {
            return value.map(v => ({ value: v, label: v }));
        }
        return [];
    }

    useEffect(() => {
        setDropdownProps({
            options: getDefaultOptions(),
            loading: false,
            emptyText: "",
        });
    }, [type]);

    useEffect(() => {
        setValue(initialValue ?? []);
    }, [initialValue]);

    function handleSearch(term: string) {
        const options = getDefaultOptions();
        if (!term) {
            setDropdownProps({
                options,
                emptyText: "",
                loading: false,
            });
        } else {
            setDropdownProps({
                options: options.filter(({ label }) => label.toLowerCase().includes(term.toLowerCase())),
                emptyText: `No ${type === FilterType.Tag ? "tag" : "project"} with the name “${term}”`,
                loading: false,
            });
        }
    }

    function handleRemoveClick() {
        onRemoveFilter(index);
    }

    function handleTypeChange(newType: FilterType) {
        let newOperation = operation;
        if (type !== newType) {
            newOperation = getDefaultOperation(newType);
        }

        onSetFilter({
            type: newType,
            operation: newOperation,
            value: getDefaultValue(newType),
        } as RegularFilter, index);
    }

    function handleTypeCancel() {
        if (!type) {
            onRemoveFilter(index);
        }
    }

    function handleOperationChange(newOperation: FilterOperation) {
        onSetFilter({
            type,
            operation: newOperation,
            value,
        } as RegularFilter, index);
    }

    function handleSingleValueChange(newValue: string | number | undefined) {
        let value: string[] = [];
        if (newValue !== undefined) {
            value = Array.isArray(newValue) ? newValue : [newValue.toString()];
        }

        setValue(value);
    }

    function handleMultiValueChange(newValue: string[]) {
        setDropdownProps({
            options: getDefaultOptions(),
            loading: false,
            emptyText: "",
        });

        onSetFilter({
            type,
            operation,
            value: newValue,
        } as RegularFilter, index);
    }

    function handleValueSubmit() {
        onSetFilter({
            type,
            operation,
            value,
        } as RegularFilter, index);
    }

    function handleFormSubmit(event: FormEvent) {
        event.preventDefault();

        handleValueSubmit();
    }

    function handleCancel() {
        setDropdownProps({
            options: getDefaultOptions(),
            loading: false,
            emptyText: "",
        });
    }

    async function handleComponentSearch(term: string) {
        if (!term) {
            setDropdownProps({
                loading: false,
                emptyText: "",
                options: value.map(v => ({ label: v, value: v })),
            });
        } else {
            setDropdownProps({
                loading: true,
                emptyText: "",
                options: [],
            });
            const { components } = await getLatestAnalysisComponents(
                workspace.slug,
                {
                    sort_key: SortType.Name,
                    sort_ascending: "true",
                    limit: 20,
                },
                [{
                    type: FilterType.Name,
                    operation: FilterOperation.Contains,
                    value: [term],
                }]
            );

            const uniqueComponentNames = [...new Set(components.map(({ name }) => name))];

            setDropdownProps({
                loading: false,
                emptyText: `No component with the name “${term}”`,
                options: uniqueComponentNames.map(name => ({ value: name, label: name })),
            });
        }

    }

    function renderFilterOperation() {
        const dataType = getFilterDataType({ type: type! } as RegularFilter);
        const options = getValidFilterTypeOperations(type!).map(operation => getFilterOperationOption(operation, dataType));
        const defaultOperation = getDefaultOperation(type!);
        return (
            <WidgetDropdown
                options={options}
                optionsOffset={4}
                value={operation}
                defaultValue={defaultOperation}
                open={!operation}
                disabled={disabled}
                onChange={handleOperationChange}/>
        );
    }

    function renderFilterValue() {
        if (
            type === FilterType.ProjectDefined ||
            type === FilterType.ProjectUsedIn
        ) {
            const options = type === FilterType.ProjectDefined ? projectOptions : internalProjectOptions;
            const values = value.map(val =>
                options.find(option => option.value === val) ??
                    { label: val, value: val, isInvalid: true }
            );

            return (
                <WidgetDropdownMulti
                    key={`${type}-${operation}-value`}
                    className={classes.valueInput}
                    options={dropdownProps.options}
                    emptyText={dropdownProps.emptyText}
                    placeholder="Select project"
                    values={values}
                    open={value.length === 0}
                    disabled={disabled}
                    onSearch={handleSearch}
                    onCancel={handleCancel}
                    onChange={v => handleMultiValueChange(v.map(({ value }) => value))}/>
            );
        }

        if (type === FilterType.Tag) {
            const values = value.map(val =>
                tagOptions.find(option => option.value === val) ??
                    { label: val, value: val, isInvalid: true }
            );

            return (
                <WidgetDropdownMulti
                    key={`${type}-${operation}-value`}
                    className={classes.valueInput}
                    options={dropdownProps.options}
                    emptyText={dropdownProps.emptyText}
                    placeholder="Select tag"
                    values={values}
                    open={value.length === 0}
                    disabled={disabled}
                    onSearch={handleSearch}
                    onCancel={handleCancel}
                    onChange={v => handleMultiValueChange(v.map(({ value }) => value))}/>
            );
        }

        if (type === FilterType.Name && operation === FilterOperation.Equals) {
            return (
                <WidgetDropdownMulti
                    className={classes.valueInput}
                    options={dropdownProps.options}
                    emptyText={dropdownProps.emptyText}
                    loading={dropdownProps.loading}
                    placeholder="Select name"
                    values={value.map(v => ({ label: v, value: v }))}
                    open={value.length === 0}
                    disabled={disabled}
                    onSearch={handleComponentSearch}
                    onCancel={handleCancel}
                    onChange={v => handleMultiValueChange(v.map(({ value }) => value))}/>
            );
        }

        if (type === FilterType.Name || type === FilterType.FilePath) {
            const textValue = valueIntoString(value);
            const placeholder = `Type a ${type === FilterType.Name ? "name" : "path"}`;

            return (
                <Tooltip content={disabled ? "Ask to join workspace to edit" : undefined} followCursor>
                    <form className={classes.form} onSubmit={handleFormSubmit}>
                        <TextInput
                            key={`${type}-${operation}-value`}
                            className={classes.valueInput}
                            value={textValue}
                            placeholder={placeholder}
                            autoFocus={textValue === undefined}
                            disabled={disabled}
                            onChange={handleSingleValueChange}
                            onBlur={handleValueSubmit}/>
                        <input className={classes.hiddenInput} type="submit"/>
                    </form>
                </Tooltip>
            );
        }

        if (
            type === FilterType.NumberOfUsages ||
            type === FilterType.NumberOfDependencies
        ) {
            const numberValue = valueIntoNumber(value);

            return (
                <Tooltip content={disabled ? "Ask to join workspace to edit" : undefined} followCursor>
                    <form className={classes.form} onSubmit={handleFormSubmit}>
                        <NumberInput
                            key={`${type}-${operation}-value`}
                            className={classes.valueInput}
                            value={numberValue}
                            autoFocus={numberValue === undefined}
                            disabled={disabled}
                            placeholder="Type a number"
                            onChange={handleSingleValueChange}
                            onBlur={handleValueSubmit}/>
                        <input className={classes.hiddenInput} type="submit"/>
                    </form>
                </Tooltip>
            );
        }
    }

    function renderOperationRow() {
        if ([FilterType.CreatedDate, FilterType.LastUpdatedDate, FilterType.LastUsageChangedDate].includes(type!)) {
            return (
                <>
                    <WidgetDate
                        className={classes.valueInput}
                        value={value[0] ?? ""}
                        defaultValue=""
                        allowEmptyValue
                        disabled={disabled}
                        onChange={val => handleMultiValueChange([val, value[1] ?? DateOption.Today])}/>
                    <IconArrow/>
                    <WidgetDate
                        className={classes.valueInput}
                        value={value[1] ?? DateOption.Today}
                        defaultValue={DateOption.Today}
                        disabled={disabled}
                        onChange={val => handleMultiValueChange([value[0] ?? "", val])}/>
                </>
            );
        }
        return (
            <>
                {renderFilterOperation()}
                {renderFilterValue()}
            </>
        );
    }

    return (
        <div className={classes.filterCell}>
            <WidgetDropdown
                options={typeOptions}
                value={type}
                placeholder="Select property"
                open={!type}
                disabled={disabled}
                onChange={handleTypeChange}
                onCancel={handleTypeCancel}/>
            {type && (
                <>
                    <div className={classes.operation}>
                        {renderOperationRow()}
                    </div>
                    {!disabled && (
                        <button
                            type="button"
                            className={classes.removeButton}
                            onClick={handleRemoveClick}>
                            <IconRemove/>
                        </button>
                    )}
                </>
            )}
        </div>
    );
}
