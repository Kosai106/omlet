import { useEffect, useRef, useState } from "react";

import classNames from "classnames";
import cliSpinners from "cli-spinners";

import classes from "./Spinner.module.css";


interface Props {
    className?: string;
}

export function Spinner({ className }: Props) {
    const [index, setIndex] = useState(0);
    const timeoutRef = useRef<number>();
    function incrementIndex() {
        setIndex(i => (i + 1) % cliSpinners.flip.frames.length);
        timeoutRef.current = window.setTimeout(incrementIndex, cliSpinners.flip.interval);
    }
    useEffect(() => {
        timeoutRef.current = window.setTimeout(incrementIndex, cliSpinners.flip.interval);
        return () => window.clearTimeout(timeoutRef.current);
    }, []);

    return <span className={classNames(classes.spinner, className)}>{cliSpinners.flip.frames[index]}</span>;
}
