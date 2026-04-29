import { type ReactNode } from "react";

import classes from "./TutorialStep.module.css";

interface Props {
    step: number;
    title: string;
    description: string;
    image: ReactNode;
}

export function TutorialStep({
    step,
    title,
    description,
    image,
}: Props) {
    return (
        <div className={classes.tutorialStep}>
            <div className={classes.header}>
                <span className={classes.step}>{step}</span>
                <span className={classes.info}>
                    <span className={classes.title}>{title}:</span>&nbsp;
                    <span className={classes.description}>{description}</span>
                </span>
            </div>
            {image}
        </div>
    );
}
