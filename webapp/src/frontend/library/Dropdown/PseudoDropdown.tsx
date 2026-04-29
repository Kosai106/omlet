import { type PropsWithChildren } from "react";

import { Button, ButtonIconPosition, ButtonKind } from "../Button/Button";
import { IconChevronDown } from "../icons/IconChevronDown";

interface Props {
    onClick(): void;
}

export function PseudoDropdown({ children, onClick }: PropsWithChildren<Props>) {
    return (
        <Button
            kind={ButtonKind.Secondary}
            icon={<IconChevronDown color="var(--label-secondary-color)"/>}
            iconPosition={ButtonIconPosition.End}
            onClick={onClick}>
            {children}
        </Button>
    );
}
