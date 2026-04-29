interface Props {
    className?: string;
    color?: string;
}

export function IconArrow({ className, color = "var(--label-secondary-color)" }: Props) {
    return (
        <svg className={className} width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M11.719 5.326a.949.949 0 0 1 0 1.348L7.64 10.721a.967.967 0 0 1-1.36 0 .949.949 0 0 1 0-1.35L9.68 6 6.282 2.628a.949.949 0 0 1 0-1.349.966.966 0 0 1 1.359 0l4.078 4.047z" fill={color}/>
            <rect y="5" width="11" height="2" rx="1" fill={color}/>
        </svg>
    );
}
