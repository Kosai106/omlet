interface Props {
    color?: string;
}

export function IconCollapse({ color = "var(--label-secondary-color)" }: Props) {
    return (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path fillRule="evenodd" clipRule="evenodd" d="M11.219 6.674a.949.949 0 0 0 0-1.348L7.14 1.279a.966.966 0 0 0-1.36 0 .949.949 0 0 0 0 1.35L9.18 6 5.782 9.372a.949.949 0 0 0 0 1.349.967.967 0 0 0 1.359 0l4.078-4.047zm-5 0a.949.949 0 0 0 0-1.348L2.14 1.279a.966.966 0 0 0-1.36 0 .949.949 0 0 0 0 1.35L4.18 6 .782 9.372a.949.949 0 0 0 0 1.349.967.967 0 0 0 1.359 0l4.077-4.047z" fill={color}/>
        </svg>
    );
}
