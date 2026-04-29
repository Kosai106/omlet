import { Fragment, useEffect } from "react";

import classNames from "classnames";

import { IconElbow } from "../../../library/icons/IconElbow";
import { Skeleton } from "../../../library/Skeleton/Skeleton";
import { range } from "../../../utils";

import classes from "./Analyses.module.css";

const ANALYSES_LOADING_PATTERN = [
    [3, 2, 3, 2],
    [3, 2, 3, 2],
];

const NEXT_PAGE_LOADING_PATTERN = [
    [3, 2],
];

function AnalysesItemLoading() {
    return (
        <div className={classNames(classes.analysisItem, classes.readOnly)}>
            <div className={classes.analysisDate}>
                <IconElbow/>
                <Skeleton className={classes.skeleton}/>
            </div>
            <div className={classes.projects}>
                <Skeleton className={classes.skeleton}/>
            </div>
            <div className={classes.diff} >
                <Skeleton className={classes.skeleton}/>
            </div>
            <div className={classes.scanner}>
                <Skeleton className={classes.skeleton}/>
            </div>
            <div className={classes.cliVersion} >
                <Skeleton className={classes.skeleton}/>
            </div>
        </div>
    );
}

interface Props {
    isFetchingNextPage?: boolean;
}

export function AnalysesLoading({
    isFetchingNextPage,
}: Props) {
    useEffect(() => {
        document.body.classList.toggle("noScroll", !isFetchingNextPage);

        return () => {
            document.body.classList.remove("noScroll");
        };
    }, [isFetchingNextPage]);

    const loadingPattern = isFetchingNextPage ? NEXT_PAGE_LOADING_PATTERN : ANALYSES_LOADING_PATTERN;

    return (
        <div className={classes.analyses}>
            {loadingPattern.map((dayCounts, i) => (
                <section key={`month-${i}`} className={classes.month}>
                    <h2 className={classes.monthTitle}>
                        <Skeleton className={classes.skeleton}/>
                    </h2>
                    {dayCounts.map((count, j) => (
                        <Fragment key={`day-${j}`}>
                            <section className={classes.day}>
                                <h3 className={classes.dayTitle}>
                                    <Skeleton className={classes.skeleton}/>
                                </h3>
                                {[...range(1, count)].map(k => (
                                    <AnalysesItemLoading key={`scan-${k}`}/>
                                ))}
                            </section>
                            {j !== dayCounts.length - 1 && <hr className={classes.separator}/>}
                        </Fragment>
                    ))}
                </section>
            ))}
        </div>
    );
}
