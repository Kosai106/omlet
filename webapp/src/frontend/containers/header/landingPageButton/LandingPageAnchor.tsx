import classNames from "classnames";

import { LandingPageButtonKind } from "./LandingPageButton";

import classes from "./LandingPageButton.module.css";

interface Props {
    className?: string;
    kind?: LandingPageButtonKind;
    label: string;
    href: string;
}

export function LandingPageAnchor({
    className,
    kind = LandingPageButtonKind.Primary,
    label,
    href,
}: Props) {
    const cls = classNames(classes.landingPageButton, { [classes.secondary]: kind === LandingPageButtonKind.Secondary }, className);

    return <a className={cls} href={href}>{label}</a>;
}
