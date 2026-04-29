interface Props {
    color?: string;
}

export function IconAdoptionByProject({ color = "var(--label-secondary-color)" }: Props) {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path fill={color} d="M1 0a1 1 0 0 0-1 1v22a1 1 0 0 0 1 1h22a1 1 0 1 0 0-2H2V1a1 1 0 0 0-1-1zm4 17a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-1a1 1 0 0 0-1-1H5zm7 1a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H13a1 1 0 0 1-1-1v-1zm7-6a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-1a1 1 0 0 0-1-1h-4zm1-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V8zM5 12a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-1a1 1 0 0 0-1-1H5zM4 8a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8z"/>
        </svg>

    );
}
