interface Props {
    className?: string;
}

export function IconFolder({ className }: Props) {
    return (
        <svg className={className} width="20" height="16" viewBox="0 0 20 16" fill="none">
            <mask id="5hzlykcaza" fill="#fff">
                <path fillRule="evenodd" clipRule="evenodd" d="M2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-6.8L9.4.75A2 2 0 0 0 7.84 0H2z"/>
            </mask>
            <path d="M11.2 3 9.638 4.25l.6.75h.962V3zM9.4.75 7.84 2 9.4.75zM2 2v-4a4 4 0 0 0-4 4h4zm0 1V2h-4v1h4zm0 1V3h-4v1h4zm0 10V4h-4v10h4zm0 0h-4a4 4 0 0 0 4 4v-4zm16 0H2v4h16v-4zm0 0v4a4 4 0 0 0 4-4h-4zm0-9v9h4V5h-4zm0 0h4a4 4 0 0 0-4-4v4zm-6.8 0H18V1h-6.8v4zM7.839 2l1.8 2.25 3.123-2.5-1.8-2.249L7.84 2zm0 0 3.123-2.499A4 4 0 0 0 7.84-2v4zM2 2h5.839v-4H2v4z" fill="currentColor" mask="url(#5hzlykcaza)"/>
        </svg>
    );
}
