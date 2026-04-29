import { type ReactNode } from "react";

import classes from "./EmptyBlock.module.css";

interface Props {
    kaomoji?: string;
    message: ReactNode;
}
export function EmptyBlock({ kaomoji = "(・_・ヾ", message }: Props) {
    return (
        <div className={classes.emptyBlock}>
            <span className={classes.kaomoji}>{kaomoji}</span>
            {message}
        </div>
    );
}
