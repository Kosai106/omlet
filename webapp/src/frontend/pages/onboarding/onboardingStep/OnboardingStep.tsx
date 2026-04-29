import { useContext, type ReactNode } from "react";

import { H2 } from "../../../library/Heading/Heading";
import { OnboardingContext } from "../OnboardingContext";

import classes from "./OnboardingStep.module.css";

interface Props {
    stepCards: ReactNode;
    stepContent: ReactNode;
}

export function OnboardingStep({
    stepCards,
    stepContent,
}: Props) {
    const {
        totalNumberOfComponents,
        totalNumberOfUsages,
    } = useContext(OnboardingContext);

    return (
        <>
            <section className={classes.onboardingSteps}>
                <H2 className={classes.h2}>Fantastic, first scan complete! 🎉</H2>
                <p>
                    You just scanned <strong>{totalNumberOfComponents} components</strong>{" "}
                    that are used <strong>{totalNumberOfUsages} times</strong>.
                    Now let’s set up your analytics dashboard.
                </p>
                <div className={classes.stepCards}>
                    {stepCards}
                </div>
            </section>
            <section className={classes.onboardingStepContents}>
                {stepContent}
            </section>
        </>
    );
}
