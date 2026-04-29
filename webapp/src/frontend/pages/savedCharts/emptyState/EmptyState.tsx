import { Link, generatePath } from "react-router-dom";

import { RoutePath } from "../../../../common/RoutePath";
import saveChartURL from "../../../assets/img/imgSaveChart.png";
import saveChart2xURL from "../../../assets/img/imgSaveChart@2x.png";
import saveChart3xURL from "../../../assets/img/imgSaveChart@3x.png";
import { H2 } from "../../../library/Heading/Heading";
import { IconBookmark } from "../../../library/icons/IconBookmark";


import classes from "./EmptyState.module.css";

interface Props {
    workspaceSlug: string;
}

export function EmptyState({ workspaceSlug }: Props) {
    return (
        <div className={classes.emptyState}>
            <div className={classes.content}>
                <div className={classes.header}>
                    <IconBookmark/>
                    <H2 className={classes.h2}>No saved charts yet.</H2>
                    <p>
                        To add a chart to your Saved Dashboard,{" "}
                        <Link to={generatePath(RoutePath.NewAnalytics, { workspaceSlug })}>create a new analysis</Link>{" "}
                        and save it when you’re ready.
                    </p>
                </div>
                <img
                    src={saveChartURL}
                    srcSet={`${saveChart2xURL} 2x, ${saveChart3xURL} 3x`}
                    alt="Save chart from a new analysis"/>
            </div>
        </div>
    );
}
