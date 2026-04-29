import classNames from "classnames";

import { type RowData, PaginatedTable } from "../paginatedTable/PaginatedTable";

import classes from "./PropertyTable.module.css";

interface Props {
    rows: RowData[];
    linksDisabled: boolean;
    onPageChange(page: number, pageSize: number): void;
}

const columnClassNames = [classes.propertyColumn, classes.componentColumn, classes.numberUsedColumn];
const headers = ["Prop", "Component", "# Used"];

export function PropertyTable({ rows, linksDisabled, onPageChange }: Props) {
    return (
        <PaginatedTable
            rowClassName={classNames(classes.propertyRow, { [classes.linksDisabled]: linksDisabled })}
            columnClassNames={columnClassNames}
            headers={headers}
            rows={rows}
            linksDisabled={linksDisabled}
            onPageChange={onPageChange}/>
    );
}
