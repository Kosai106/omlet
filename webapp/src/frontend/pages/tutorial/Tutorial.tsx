import { useEffect, useState } from "react";

import tutorialComponentCatalogueImageURL from "../../assets/img/imgTutorialComponentCatalogue.png";
import tutorialComponentCatalogueImage2xURL from "../../assets/img/imgTutorialComponentCatalogue@2x.png";
import tutorialDependencyTreeImageURL from "../../assets/img/imgTutorialDependencyTree.png";
import tutorialDependencyTreeImage2xURL from "../../assets/img/imgTutorialDependencyTree@2x.png";
import tutorialPropUsageImageURL from "../../assets/img/imgTutorialPropUsage.png";
import tutorialPropUsageImage2xURL from "../../assets/img/imgTutorialPropUsage@2x.png";
import { Header } from "../../containers/header/Header";
import { Keyboard } from "../../enums";
import { Button, ButtonKind, ButtonLink } from "../../library/Button/Button";
import { H2 } from "../../library/Heading/Heading";
import { LogoCookie } from "../../library/logos/LogoCookie";

import { TutorialStep } from "./tutorialStep/TutorialStep";
import { TutorialStepIndicator } from "./tutorialStepIndicator/TutorialStepIndicator";

import classes from "./Tutorial.module.css";

const STEPS = [{
    title: "Popular Charts",
    description: "Gain insight into component usage, adoption trends across projects with ready-to-use graphs.",
    image: <div className={classes.popularChartsImage}/>,
}, {
    title: "Component Catalog",
    description: "Collect all your re-usable and custom components in a searchable catalogue —\xa0no\xa0manual\xa0work.",
    image: <img src={tutorialComponentCatalogueImageURL} srcSet={`${tutorialComponentCatalogueImage2xURL} 2x`} alt="Component Catalog"/>,
}, {
    title: "Dependency Tree",
    description: "Visualize where your components are used, be confident as you update them.",
    image: <img src={tutorialDependencyTreeImageURL} srcSet={`${tutorialDependencyTreeImage2xURL} 2x`} alt="Dependency Tree"/>,
}, {
    title: "Prop Usage Details",
    description: "Gain insight into which props are being used, which values are passed and where.",
    image: <img src={tutorialPropUsageImageURL} srcSet={`${tutorialPropUsageImage2xURL} 2x`} alt="Prop Usage Details"/>,
}];

export function Tutorial() {
    const [step, setStep] = useState(0);

    function handleBackButtonClick() {
        setStep(stp => stp - 1);
    }

    function handleNextButtonClick() {
        setStep(stp => stp + 1);
    }

    function handleKeyDown(event: KeyboardEvent) {
        switch (event.code) {
            case Keyboard.Code.ArrowLeft:
                setStep(stp => Math.max(0, stp - 1));
                break;

            case Keyboard.Code.ArrowRight:
                setStep(stp => Math.min(stp + 1, STEPS.length - 1));
                break;
        }
    }

    useEffect(() => {
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    function renderNextButton() {
        if (step === STEPS.length - 1) {
            return (
                <ButtonLink
                    className={classes.tutorialButton}
                    to="/">
                    Continue: Get started
                </ButtonLink>
            );
        }

        return (
            <Button
                className={classes.tutorialButton}
                onClick={handleNextButtonClick}>
                Next: {STEPS[step + 1].title}
            </Button>
        );
    }

    return (
        <>
            <Header
                leftContent={undefined}
                hideRightContent/>
            <main className={classes.main}>
                <div className={classes.header}>
                    <LogoCookie/>
                    <H2 className={classes.h2}>Savor the taste of Omlet</H2>
                </div>
                <TutorialStep
                    step={step + 1}
                    title={STEPS[step].title}
                    description={STEPS[step].description}
                    image={STEPS[step].image}/>
                <footer className={classes.footer}>
                    <div className={classes.leftButtons}>
                        {step !== 0 && (
                            <Button
                                className={classes.tutorialButton}
                                kind={ButtonKind.Secondary}
                                onClick={handleBackButtonClick}>
                                Back: {STEPS[step - 1].title}
                            </Button>
                        )}
                    </div>
                    <TutorialStepIndicator step={step} count={STEPS.length}/>
                    <div className={classes.rightButtons}>
                        {step !== STEPS.length - 1 && (
                            <ButtonLink
                                kind={ButtonKind.Secondary}
                                to="/">
                                Skip
                            </ButtonLink>
                        )}
                        {renderNextButton()}
                    </div>
                </footer>
            </main>
        </>
    );
}
