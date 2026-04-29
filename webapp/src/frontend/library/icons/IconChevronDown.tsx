interface Props {
    color?: string;
}

export function IconChevronDown({ color = "var(--label-primary-color)" }: Props) {
    return (
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path fill={color} d="M6.865 1h-5.73a1 1 0 0 0-.768 1.64l2.865 3.438a1 1 0 0 0 1.536 0L7.633 2.64A1 1 0 0 0 6.865 1z"/>
        </svg>
    );
}
