import classNames from "classnames";

import classes from "./AnimatedArrow.module.css";

interface Props {
    className?: string;
}

export function AnimatedArrow({ className }: Props) {
    return (
        <svg className={classNames(classes.animatedArrow, className)} width="74" height="19" viewBox="0 0 74 19" fill="none">
            <g stroke="#2CC653" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path className={classes.body} d="M2 9c9.5 4 34.5 8.2 58.5-7" transform="translate(0 5)"/>
                <path className={classes.head} d="M2.5 9.5c1.667.5 5.6 3.6 8 8C13.7 11.9 19.833 4.167 22 2L2 3.5" transform="translate(50.5 0)"/>
            </g>
        </svg>
    );
}

