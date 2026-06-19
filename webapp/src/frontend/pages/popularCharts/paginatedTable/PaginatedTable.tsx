import { useState, type CSSProperties, type ReactNode, useMemo } from "react";

import classNames from "classnames";
import { Link } from "react-router-dom";

import { IconBack } from "../../../library/icons/IconBack";
import { IconForward } from "../../../library/icons/IconForward";
import { arrayChunk } from "../../../utils";

import classes from "./PaginatedTable.module.css";

export interface RowData {
    link: string;
    cells: ReactNode[];
}

interface RowProps extends RowData {
    rowClassName?: string;
    columnClassNames: string[];
    linksDisabled: boolean;
}

function TableRow({
    rowClassName,
    columnClassNames,
    link,
    linksDisabled,
    cells,
}: RowProps) {
    if (linksDisabled) {
        return (
            <div className={classNames(classes.row, rowClassName)}>
                {cells.map((cell, index) =>
                    <div
                        key={index}
                        className={classNames(classes.cell, columnClassNames[index])}>
                        {cell}
                    </div>
                )}
            </div>
        );
    }

    return (
        <Link className={classNames(classes.row, rowClassName)} to={link}>
            {cells.map((cell, index) =>
                <div
                    key={index}
                    className={classNames(classes.cell, columnClassNames[index])}>
                    {cell}
                </div>
            )}
        </Link>
    );
}

interface Props {
    rowClassName?: string;
    columnClassNames: string[];
    headers: ReactNode[];
    rows: RowData[];
    linksDisabled: boolean;
    pageSize?: number;
    onPageChange?(page: number, pageSize: number): void;
}

const DEFAULT_PAGE_SIZE = 5;

export function PaginatedTable({
    rowClassName,
    columnClassNames,
    headers,
    rows,
    linksDisabled,
    pageSize = DEFAULT_PAGE_SIZE,
    onPageChange,
}: Props) {
    const [currentPage, setCurrentPage] = useState(0);

    const pages = useMemo(() => [...arrayChunk(rows, pageSize)], [rows, pageSize]);

    function handleBackClick() {
        onPageChange?.(currentPage, pages.length);
        setCurrentPage(curPage => curPage - 1);
    }

    function handleForwardClick() {
        onPageChange?.(currentPage + 2, pages.length);
        setCurrentPage(curPage => curPage + 1);
    }

    return (
        <div className={classes.paginatedTable} style={{ "--page-size": pageSize } as CSSProperties}>
            <div className={classes.header}>
                {headers.map((header, index) =>
                    <div key={index} className={columnClassNames[index]}>{header}</div>
                )}
            </div>
            <div className={classes.body}>
                {pages[currentPage].map((row, index) =>
                    <TableRow
                        key={currentPage * pageSize + index}
                        rowClassName={rowClassName}
                        columnClassNames={columnClassNames}
                        linksDisabled={linksDisabled}
                        {...row}/>
                )}
            </div>
            {pages.length > 1 && (
                <div className={classes.footer}>
                    <button onClick={handleBackClick} disabled={currentPage === 0}><IconBack/></button>
                    <div className={classes.pageIndicator}>{currentPage + 1} of {pages.length}</div>
                    <button onClick={handleForwardClick} disabled={currentPage === pages.length - 1}><IconForward/></button>
                </div>
            )}
        </div>
    );
}
