import { IconPlay } from "../../../../library/icons/IconPlay";

import classes from "./PlayButton.module.css";

interface Props {
    onClick?(): void;
}

export function PlayButton({ onClick }: Props) {
    return (
        <button
            className={classes.playButton}
            type="button"
            onClick={onClick}>
            <IconPlay/>
        </button>
    );
}
