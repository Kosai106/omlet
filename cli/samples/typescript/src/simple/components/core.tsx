export function CoreHeader({ children }: { children: any; }) {
    return (
        <header>
            Header
            <div>{children}</div>
        </header>
    );
}

export function MenuLayout({ children }: { children: any; }) {
    return (
        <div>
            {children}
        </div>
    );
}
