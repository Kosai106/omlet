import classNames from "classnames";

import omletFlipURL from "../../assets/img/omletFlip.gif";

import classes from "./Loading.module.css";

interface Props {
    className?: string;
}

export function Loading({ className }: Props) {
    return (
        <div className={classNames(classes.loading, className)}>
            <img src={omletFlipURL} alt="Loading…"/>
        </div>
    );
}
