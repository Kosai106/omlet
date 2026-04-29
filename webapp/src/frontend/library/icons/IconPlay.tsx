interface Props {
    className?: string;
}

export function IconPlay({ className }: Props) {
    return (
        <svg className={className} width="24" height="24" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="12" fill="#2CC653"/>
            <path d="M16.842 10.312a2 2 0 0 1 0 3.376l-5.52 3.506c-1.331.845-3.072-.111-3.072-1.689v-7.01c0-1.578 1.74-2.534 3.072-1.689l5.52 3.506z" fill="#fff"/>
        </svg>
    );
}
