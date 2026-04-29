import classNames from "classnames";

import { range } from "../../../utils";

import classes from "./TutorialStepIndicator.module.css";

interface Props {
    step: number;
    count: number;
}

export function TutorialStepIndicator({
    step,
    count,
}: Props) {
    return (
        <div className={classes.tutorialStepIndicator}>
            {[...range(0, count - 1)].map(index =>
                <div
                    key={index}
                    className={classNames(classes.dot, {
                        [classes.current]: index === step,
                        [classes.past]: index < step,
                    })}/>
            )}
        </div>
    );
}
