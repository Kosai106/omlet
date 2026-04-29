interface Props {
    className?: string;
}

export function IconBack({ className }: Props) {
    return (
        <svg className={className} width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path d="M2.696 5.326a.949.949 0 0 0 0 1.348l4.077 4.047a.967.967 0 0 0 1.36 0 .949.949 0 0 0 0-1.35L4.734 6l3.399-3.372a.949.949 0 0 0 0-1.349.966.966 0 0 0-1.36 0L2.696 5.326z"/>
        </svg>
    );
}
