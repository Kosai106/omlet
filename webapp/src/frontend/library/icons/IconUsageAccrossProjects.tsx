interface Props {
    color?: string;
}

export function IconUsageAccrossProjects({ color = "var(--label-secondary-color)" }: Props) {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path fill={color} d="M0 1a1 1 0 0 1 2 0v21h21a1 1 0 1 1 0 2H1a1 1 0 0 1-1-1V1zm4 7a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8zm1 4a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-1a1 1 0 0 0-1-1H5zm0 5a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1a1 1 0 0 0-1-1H5z"/>
        </svg>

    );
}
