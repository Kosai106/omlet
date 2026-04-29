import classNames from "classnames";
import { Link } from "react-router-dom";

import { LandingPageButtonKind } from "./LandingPageButton";

import classes from "./LandingPageButton.module.css";

interface Props {
    className?: string;
    kind?: LandingPageButtonKind;
    label: string;
    to: string;
}

export function LandingPageLink({
    className,
    kind = LandingPageButtonKind.Primary,
    label,
    to,
}: Props) {
    const cls = classNames(classes.landingPageButton, { [classes.secondary]: kind === LandingPageButtonKind.Secondary }, className);

    return <Link className={cls} to={to}>{label}</Link>;
}
