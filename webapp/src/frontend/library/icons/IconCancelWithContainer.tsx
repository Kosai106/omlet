interface Props {
    className?: string;
}

export function IconCancelWithContainer({ className }: Props) {
    return (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" className={className}>
            <path fillRule="evenodd" clipRule="evenodd" d="M6 12A6 6 0 1 0 6 0a6 6 0 0 0 0 12zM3.282 4.64A.961.961 0 1 1 4.64 3.283L6 4.64l1.36-1.36a.961.961 0 1 1 1.358 1.36L7.36 6l1.36 1.36a.961.961 0 1 1-1.36 1.358L6 7.36 4.64 8.72a.961.961 0 1 1-1.358-1.36L4.64 6 3.28 4.64z" />
        </svg>

    );
}
