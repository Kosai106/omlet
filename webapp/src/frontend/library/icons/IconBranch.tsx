interface Props {
    className?: string;
    color?: string;
}

export function IconBranch({
    className,
    color = "var(--button-background-disabled-color)",
}: Props) {
    return (
        <svg className={className} width="8" height="6" viewBox="0 0 8 6" fill="none">
            <path d="M.5.5v1a4 4 0 0 0 4 4h3" stroke={color} strokeLinecap="round"/>
        </svg>
    );
}
