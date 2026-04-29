import { type PropsWithChildren, type FunctionComponent } from "react";

import { AngelIllustration } from "./illustrations/AngelIllustration";
import { CloudIllustration } from "./illustrations/CloudIllustration";
import { DefaultIllustration } from "./illustrations/DefaultIllustration";
import { SnitchIllustration } from "./illustrations/SnitchIllustration";

import classes from "./LogoCard.module.css";

export enum Illustration {
    Default,
    Snitch,
    Angel,
    Clouds,
}

const illustrationMap: Record<Illustration, FunctionComponent> = {
    [Illustration.Default]: DefaultIllustration,
    [Illustration.Snitch]: SnitchIllustration,
    [Illustration.Angel]: AngelIllustration,
    [Illustration.Clouds]: CloudIllustration,
};


interface Props {
    illustration?: Illustration;
    title: string;
}

export function LogoCard({ title, children, illustration = Illustration.Default }: PropsWithChildren<Props>) {
    const IllustrationComponent = illustrationMap[illustration];
    return (
        <div className={classes.logoCard}>
            <IllustrationComponent/>
            <h2 className={classes.title}>{title}</h2>
            <div className={classes.content}>
                {children}
            </div>
        </div>
    );
}
