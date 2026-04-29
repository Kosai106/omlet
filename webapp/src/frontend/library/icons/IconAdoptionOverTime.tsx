interface Props {
    color?: string;
}

export function IconAdoptionOverTime({ color = "var(--label-secondary-color)" }: Props) {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path fill={color} d="M0 1a1 1 0 0 1 2 0v21h21a1 1 0 1 1 0 2H1a1 1 0 0 1-1-1V1zm4.4 9.7 2.98-2.235a1 1 0 0 1 1.225.019L13 12l11-7v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-7.5a1 1 0 0 1 .4-.8z"/>
        </svg>
    );
}
