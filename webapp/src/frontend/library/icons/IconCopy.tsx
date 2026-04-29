interface Props {
    size?: number;
    color?: string;
}

export function IconCopy({ size = 16, color = "var(--label-secondary-color)" }: Props) {
    return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
            <rect x="3" y="6" width="7" height="7" rx="1" stroke={color} strokeWidth="2"/>
            <path d="M7 4h5v5h-1v2h1a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v1h2V4z" fill={color}/>
        </svg>
    );
}
