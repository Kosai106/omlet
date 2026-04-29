import { type PropsWithChildren, useMemo } from "react";

import classNames from "classnames";
import { Link, useLocation, useSearchParams } from "react-router-dom";

import { type ChartDatum } from "../../../../common/models/ChartDatum";
import { BarChart } from "../../../common/chart/barChart/BarChart";
import { ChartMode } from "../../../common/chart/barChart/ChartMode";
import { ChartType } from "../../../common/chart/ChartType";
import { ButtonKind, ButtonLink } from "../../../library/Button/Button";
import { IconChevronDown } from "../../../library/icons/IconChevronDown";
import { IconChevronUp } from "../../../library/icons/IconChevronUp";
import { IconFilter } from "../../../library/icons/IconFilter";
import { IconWarning } from "../../../library/icons/IconWarning";
import { Skeleton } from "../../../library/Skeleton/Skeleton";
import { Tooltip } from "../../../library/Tooltip/Tooltip";
import { type ComponentProp } from "../../../models/ComponentProp";
import { propValueToString } from "../../../models/PropValue";
import { range } from "../../../utils";

import classes from "./PropsTable.module.css";

function propValueToChartDatum(
    propName: string,
    propValue: string,
    numberOfUsages: number,
    defaultValue: string | undefined,
    searchParam: URLSearchParams,
    hash: string
): ChartDatum {
    const nextSearchParams = new URLSearchParams(searchParam);
    nextSearchParams.set("selected_prop", propName);
    nextSearchParams.set("selected_value", propValue);
    const link = {
        hash,
        search: `?${nextSearchParams.toString()}`,
    };

    return {
        id: propValue,
        label: ["undefined", "null", "[not set]"].includes(propValue) && defaultValue !== undefined ? `${propValue} (${defaultValue})` : propValue,
        link,
        infoTooltip: propValue === "dynamic" ? "Variables and values with non primitive types are listed as dynamic" : undefined,
        values: [{
            id: propValue,
            name: propValue,
            link,
            value: numberOfUsages,
            color: ["[not set]"].includes(propValue) ? "var(--chart-color-13)" : undefined,
        }],
    };
}

function getTableRowData(props: ComponentProp[], searchParam: URLSearchParams, hash: string) {
    return props.map(prop => {
        const defaultValue = propValueToString(prop.defaultValue);
        return {
            name: prop.name,
            defaultValue,
            numberOfUsages: prop.numberOfUsages,
            numberOfValues: prop.numberOfValues,
            chartData: prop.values.map<ChartDatum>(({ name, numberOfUsages }) =>
                propValueToChartDatum(prop.name, name, numberOfUsages, defaultValue, searchParam, hash)
            ),
        };
    });
}

interface PropDetailColumnProps {
    className?: string;
    onClick?(): void;
}

function PropDetailColumn({
    className,
    onClick,
    children,
}: PropsWithChildren<PropDetailColumnProps>) {
    const cls = classNames(classes.cell, className);

    if (onClick) {
        return <button className={cls} onClick={onClick}>{children}</button>;
    }

    return <div className={cls}>{children}</div>;
}

interface PropDetailRowProps {
    name: string;
    defaultValue?: string;
    values: ChartDatum[];
    definedValueCount: number;
    totalCount: number;
    hasSeparator: boolean;
    isExpanded: boolean;
    onClick(): void;
}

function PropDetailRow({
    name: propName,
    defaultValue,
    values,
    definedValueCount,
    totalCount,
    hasSeparator,
    isExpanded,
    onClick,
}: PropDetailRowProps) {
    const { hash } = useLocation();
    const [searchParam] = useSearchParams();
    const barCount = totalCount === 0 ? 0 : Math.ceil(definedValueCount / totalCount * 5);

    function getNextPathForPropUsageClick() {
        const nextSearchParams = new URLSearchParams(searchParam);
        nextSearchParams.set("selected_prop", propName);
        return {
            hash,
            search: `?${nextSearchParams.toString()}`,
        };
    }

    return (
        <div className={classNames(classes.row, { [classes.expanded]: isExpanded, [classes.expandable]: definedValueCount > 0 })} key={propName}>
            {hasSeparator && <div className={classes.separator}/>}
            <PropDetailColumn className={classes.propName} onClick={definedValueCount > 0 ? onClick : undefined}>
                {propName}
            </PropDetailColumn>
            <PropDetailColumn className={classes.defaultValue} onClick={definedValueCount > 0 ? onClick : undefined}>
                {defaultValue ?? "—"}
            </PropDetailColumn>
            <PropDetailColumn className={classes.numberOfUsed} onClick={definedValueCount > 0 ? onClick : undefined}>
                {definedValueCount > 0 && (
                    <ButtonLink
                        kind={ButtonKind.Ninja}
                        className={classes.usageDetailButton}
                        to={getNextPathForPropUsageClick()}
                        icon={<IconFilter />}>
                        <span>List usages</span>
                    </ButtonLink>
                )}
                <div className={classes.count}>
                    {definedValueCount === 0 && (
                        <Tooltip content={<><span className={classes.tooltipPropName}>"{propName}"</span> is not used anywhere</>}>
                            <IconWarning/>
                        </Tooltip>
                    )}
                    <span> {definedValueCount} of {totalCount}</span>
                </div>
                <div
                    className={classNames(classes.usageIndicator, { [classes.empty]: definedValueCount === 0 })}>
                    <div
                        className={classNames(classes.bar, { [classes.empty]: barCount <= 0 })}/>
                    <div
                        className={classNames(classes.bar, { [classes.empty]: barCount <= 1 })}/>
                    <div
                        className={classNames(classes.bar, { [classes.empty]: barCount <= 2 })}/>
                    <div
                        className={classNames(classes.bar, { [classes.empty]: barCount <= 3 })}/>
                    <div
                        className={classNames(classes.bar, { [classes.empty]: barCount <= 4 })}/>
                </div>
            </PropDetailColumn>
            {isExpanded && (
                <div className={classes.propValuesDetail}>
                    <div className={classes.bar} />
                    <div className={classes.content}>
                        <BarChart
                            className={classes.barChart}
                            labelClassName={classes.barLabel}
                            mode={ChartMode.Absolute}
                            type={ChartType.Small}
                            data={values}
                            tagMap={{}}
                            legendItems={[]}/>
                    </div>
                </div>
            )}
        </div>
    );
}

const NUMBER_OF_SKELETON_ROWS = 8;

interface Props {
    loading: boolean;
    componentName: string;
    props: ComponentProp[];
    numberOfUsages: number;
    expandedProps: Set<string>;
    onPropClick(name: string): void;
}
export function PropsTable({
    loading,
    componentName,
    props,
    numberOfUsages: totalNumberOfUsages,
    expandedProps,
    onPropClick,
}: Props) {
    const { hash } = useLocation();
    const [searchParam] = useSearchParams();
    const isDescending = searchParam.get("sort") !== "asc";
    const icon = isDescending
        ? <IconChevronDown color="var(--label-secondary-color)"/>
        : <IconChevronUp color="var(--label-secondary-color)"/>;

    const rows = useMemo(() => getTableRowData(props, searchParam, hash), [props]);

    function getNextSearchParamForSortChange() {
        const nextSearchParams = new URLSearchParams(searchParam);
        if (isDescending) {
            nextSearchParams.set("sort", "asc");
        } else {
            nextSearchParams.delete("sort");
        }
        return nextSearchParams;
    }

    if (loading) {
        return (
            <div className={classNames(classes.propsTable, classes.loading)}>
                <div className={classes.header}>
                    <div className={classNames(classes.cell, classes.propName)}>
                        <span>
                            Props
                        </span>
                    </div>
                    <div className={classNames(classes.cell, classes.defaultValue)}>
                        Default value
                    </div>
                    <div>
                        <Link
                            type="button"
                            className={classNames(classes.cell, classes.numberOfUsed)}
                            to={{
                                hash,
                                search: `?${getNextSearchParamForSortChange().toString()}`,
                            }}>
                            <span># Used</span>
                            {icon}
                        </Link>
                    </div>
                </div>
                {[...range(1, NUMBER_OF_SKELETON_ROWS)].map(i => {
                    return (
                        <div className={classes.row} key={i}>
                            {i > 1 && <div className={classes.separator}/>}
                            <div className={classNames(classes.cell, classes.propName)}>
                                <Skeleton className={classes.skeleton} />
                            </div>
                            <div className={classNames(classes.cell, classes.defaultValue)}>
                                <Skeleton className={classes.skeleton} />
                            </div>
                            <div className={classNames(classes.cell, classes.numberOfUsed)}>
                                <Skeleton className={classes.skeleton} />
                                <Skeleton className={classes.skeleton} />
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }

    if (rows.length === 0) {
        return <div className={classes.emptyState}>
            <div className={classes.kaomoji}>(⊙_⊙)</div>
            <div>No props found for "{componentName}"</div>
        </div>;
    }

    return (
        <div className={classes.propsTable}>
            <div className={classes.header}>
                <div className={classNames(classes.cell, classes.propName)}>
                    <span>
                        Props
                    </span>
                </div>
                <div className={classNames(classes.cell, classes.defaultValue)}>
                    Default value
                </div>
                <Link
                    type="button"
                    className={classNames(classes.cell, classes.numberOfUsed)}
                    to={{
                        hash,
                        search: `?${getNextSearchParamForSortChange().toString()}`,
                    }}>
                    <span># Used</span>
                    {icon}
                </Link>
            </div>
            {rows.sort((a, b) => isDescending ? b.numberOfUsages - a.numberOfUsages : a.numberOfUsages - b.numberOfUsages)
                .map(({ name, defaultValue, chartData, numberOfUsages }, i) => {
                    const isExpanded = expandedProps.has(name);
                    return (
                        <PropDetailRow
                            key={name}
                            name={name}
                            defaultValue={defaultValue}
                            values={chartData}
                            definedValueCount={numberOfUsages}
                            totalCount={totalNumberOfUsages}
                            hasSeparator={i > 0}
                            isExpanded={isExpanded}
                            onClick={() => onPropClick(name)}/>
                    );
                })}
        </div>
    );
}
