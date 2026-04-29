interface Props {
    className?: string;
}

export function IconChevronRight({ className }: Props) {
    return (
        <svg className={className} width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path
                d="M1 1.135v5.73a1 1 0 0 0 1.64.768l3.438-2.865a1 1 0 0 0 0-1.536L2.64.367A1 1 0 0 0 1 1.135z"
                fill="currentColor"/>
        </svg>
    );
}
