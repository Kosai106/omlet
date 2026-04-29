interface Props {
    className?: string;
}

export function IconForward({ className }: Props) {
    return (
        <svg className={className} width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path d="M9.304 5.326a.949.949 0 0 1 0 1.348l-4.077 4.047a.967.967 0 0 1-1.36 0 .949.949 0 0 1 0-1.35L7.266 6 3.867 2.628a.949.949 0 0 1 0-1.349.966.966 0 0 1 1.36 0l4.077 4.047z"/>
        </svg>
    );
}
