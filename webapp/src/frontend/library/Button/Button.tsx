import { type AnchorHTMLAttributes, type MouseEventHandler, type ReactNode, forwardRef } from "react";

import classNames from "classnames";
import { type LinkProps, Link } from "react-router-dom";

import classes from "./Button.module.css";

enum Kind {
    Primary = "primary",
    Secondary = "secondary",
    Inverse = "inverse",
    Ninja = "ninja",
}

enum Shape {
    Pill = "pill",
    Rectangle = "rectangle",
}

enum IconPosition {
    Start = "start",
    End = "end",
}

interface Props {
    className?: string;
    kind?: Kind;
    shape?: Shape;
    type?: "submit" | "button" | "reset";
    active?: boolean;
    title?: string;
    icon?: ReactNode;
    iconPosition?: IconPosition;
    children: ReactNode;
    disabled?: boolean;
    onClick?: MouseEventHandler<HTMLButtonElement>;
}

export const Button = forwardRef<HTMLButtonElement, Props>((
    {
        className,
        kind = Kind.Primary,
        shape = Shape.Rectangle,
        type = "button",
        active = false,
        title,
        icon,
        iconPosition = IconPosition.Start,
        children,
        disabled = false,
        onClick,
    },
    buttonRef,
) => {
    const clss = classNames(classes.button, className, {
        [classes.pill]: shape === Shape.Pill,
        [classes.rectangle]: shape === Shape.Rectangle,
        [classes.primary]: kind === Kind.Primary,
        [classes.secondary]: kind === Kind.Secondary,
        [classes.inverse]: kind === Kind.Inverse,
        [classes.ninja]: kind === Kind.Ninja,
        [classes.noAction]: type === "button" && onClick === undefined,
        [classes.active]: active,
        [classes.withIcon]: Boolean(icon),
        [classes.end]: Boolean(icon) && iconPosition === IconPosition.End,
    });

    return (
        <button
            ref={buttonRef}
            type={type}
            className={clss}
            title={title}
            disabled={disabled}
            onClick={onClick}>
            {iconPosition === IconPosition.Start && icon}
            {children}
            {iconPosition === IconPosition.End && icon}
        </button>
    );
});

type ButtonLinkProps = Omit<Props, "disabled" | "type" | "onClick"> & LinkProps;

export const ButtonLink = forwardRef<HTMLAnchorElement, ButtonLinkProps>((
    {
        className,
        kind = Kind.Primary,
        shape = Shape.Rectangle,
        active = false,
        title,
        icon,
        iconPosition = IconPosition.Start,
        children,
        to,
        onClick,
    },
    ref,
) => {
    const clss = classNames(classes.button, className, {
        [classes.pill]: shape === Shape.Pill,
        [classes.rectangle]: shape === Shape.Rectangle,
        [classes.primary]: kind === Kind.Primary,
        [classes.secondary]: kind === Kind.Secondary,
        [classes.inverse]: kind === Kind.Inverse,
        [classes.ninja]: kind === Kind.Ninja,
        [classes.active]: active,
        [classes.withIcon]: Boolean(icon),
        [classes.end]: Boolean(icon) && iconPosition === IconPosition.End,
    });

    return (
        <Link
            ref={ref}
            className={clss}
            to={to}
            title={title}
            onClick={onClick}>
            {iconPosition === IconPosition.Start && icon}
            {children}
            {iconPosition === IconPosition.End && icon}
        </Link>
    );
});

type ButtonAnchorProps = Omit<Props, "disabled" | "type" | "onClick"> & AnchorHTMLAttributes<HTMLAnchorElement>;

export const ButtonAnchor = forwardRef<HTMLAnchorElement, ButtonAnchorProps>((
    {
        className,
        kind = Kind.Primary,
        shape = Shape.Rectangle,
        active = false,
        title,
        icon,
        iconPosition = IconPosition.Start,
        children,
        href,
        rel,
        target,
        onClick,
    },
    ref,
) => {
    const clss = classNames(classes.button, className, {
        [classes.pill]: shape === Shape.Pill,
        [classes.rectangle]: shape === Shape.Rectangle,
        [classes.primary]: kind === Kind.Primary,
        [classes.secondary]: kind === Kind.Secondary,
        [classes.inverse]: kind === Kind.Inverse,
        [classes.ninja]: kind === Kind.Ninja,
        [classes.active]: active,
        [classes.withIcon]: Boolean(icon),
        [classes.end]: Boolean(icon) && iconPosition === IconPosition.End,
    });

    return (
        <a
            ref={ref}
            className={clss}
            href={href}
            rel={rel}
            target={target}
            title={title}
            onClick={onClick}>
            {iconPosition === IconPosition.Start && icon}
            {children}
            {iconPosition === IconPosition.End && icon}
        </a>
    );
});

export {
    Shape as ButtonShape,
    Kind as ButtonKind,
    IconPosition as ButtonIconPosition,
};
