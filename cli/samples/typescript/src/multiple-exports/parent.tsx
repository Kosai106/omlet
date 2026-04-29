import { Margin, default as Child } from "./child";

export function Parent() {
    return (
        <>
            <Child/>
            <Margin/>
        </>
    );
}