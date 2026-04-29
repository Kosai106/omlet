import classNames from "classnames";

import { type RowData, PaginatedTable } from "../paginatedTable/PaginatedTable";

import classes from "./ComponentTable.module.css";

interface Props {
    rows: RowData[];
    linksDisabled: boolean;
}

const columnClassNames = [classes.componentColumn, classes.createdColumn, classes.numberUsedColumn];
const headers = ["Component", "Created", "# Used"];

export function ComponentTable({ rows, linksDisabled }: Props) {
    return (
        <PaginatedTable
            rowClassName={classNames(classes.componentRow, { [classes.linksDisabled]: linksDisabled })}
            columnClassNames={columnClassNames}
            headers={headers}
            rows={rows}
            linksDisabled={linksDisabled}/>
    );
}
