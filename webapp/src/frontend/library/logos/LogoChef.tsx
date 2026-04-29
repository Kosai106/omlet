interface Props {
    className?: string;
}

export function LogoChef({ className }: Props) {
    return (
        <svg className={className} width="36" height="32" viewBox="0 0 36 32" fill="none">
            <path d="M5 22.064a9 9 0 0 1 4.504-17.05A10.978 10.978 0 0 1 18 1c3.426 0 6.482 1.567 8.496 4.014A9 9 0 0 1 31 22.064V29a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-6.936z" fill="#262B2E"/>
            <path d="M7 20.71a7 7 0 0 1 3.421-13.565A8.991 8.991 0 0 1 18 3a8.991 8.991 0 0 1 7.579 4.145A7 7 0 0 1 29 20.71V29a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1v-8.29z" fill="#383E41"/>
            <path d="M27 19v8a1 1 0 0 1-1 1H10a1 1 0 0 1-1-1v-8a5 5 0 1 1 2.415-9.38 7.003 7.003 0 0 1 13.17 0A5 5 0 1 1 27 19z" fill="#FDBD39"/>
            <path d="M9 22h18v5a1 1 0 0 1-1 1H10a1 1 0 0 1-1-1v-5z" fill="#F69833"/>
            <circle cx="27" cy="14" r="5" fill="#FDBD39"/>
            <circle cx="18" cy="12" r="7" fill="#FDBD39"/>
            <circle cx="9" cy="14" r="5" fill="#FDBD39"/>
            <rect x="11" y="20" width="2" height="6" rx="1" fill="#262B2E"/>
            <rect x="15" y="20" width="2" height="6" rx="1" fill="#262B2E"/>
        </svg>

    );
}
