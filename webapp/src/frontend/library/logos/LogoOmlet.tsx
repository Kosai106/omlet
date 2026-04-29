interface Props {
    size?: number;
    backgroundType?: "light" | "dark";
}

export function LogoOmlet({ size = 36, backgroundType = "light" }: Props) {
    const outerCircleColor = backgroundType === "light" ? "#262B2E" : "#42484A";

    return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
            <circle cx="18" cy="18" r="18" fill={outerCircleColor}/>
            <circle cx="18" cy="18" r="15" fill="#42484A"/>
            <path d="M20.605 3.228a3 3 0 0 0-3.476 2.433l-4.167 23.636a3 3 0 0 0 2.433 3.475c8.159 1.439 15.939-4.009 17.377-12.167 1.439-8.159-4.009-15.938-12.167-17.377z" fill="#F69833"/>
            <path d="M19.203 3.315a3 3 0 0 0-2.074 2.348l-4.167 23.635a3 3 0 0 0 1.146 2.915c6.926-.242 12.98-5.289 14.232-12.388 1.252-7.1-2.71-13.913-9.137-16.51z" fill="#FFC738"/>
        </svg>

    );
}
