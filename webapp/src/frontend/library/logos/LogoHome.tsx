interface Props {
    className?: string;
}

export function LogoHome({ className }: Props) {
    return (
        <svg className={className} width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M14.424 1.587 4.03 6.042A5 5 0 0 0 1 10.638V26a5 5 0 0 0 5 5h20a5 5 0 0 0 5-5V10.638a5 5 0 0 0-3.03-4.596L17.576 1.587a4 4 0 0 0-3.152 0z" fill="#383E41" stroke="#000" strokeWidth="2"/>
            <path d="m15.23 4.82-10 4.167A2 2 0 0 0 4 10.833V26a2 2 0 0 0 2 2h20a2 2 0 0 0 2-2V10.833a2 2 0 0 0-1.23-1.846l-10-4.166a2 2 0 0 0-1.54 0z" fill="#FFC738"/>
            <rect x="18" y="11" width="5.5" height="5" rx="1" fill="#F69833"/>
            <rect x="8.5" y="11" width="5.5" height="5" rx="1" fill="#F69833"/>
            <rect x="18" y="19" width="5.5" height="5" rx="1" fill="#F69833"/>
            <rect x="8.5" y="19" width="5.5" height="5" rx="1" fill="#F69833"/>
        </svg>

    );
}
