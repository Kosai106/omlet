import { Button, Input } from "./used-indirectly";

export function ExportedFooter() {
    return <div>
        <Button/>
    </div>;
}

function Footer() {
    return <div>
        <Button/>
    </div>;
}

function getInput() {
    return Input;
}

export function Dialog() {
    const InputComp = getInput();

    return <div>
        <h1>Hello</h1>
        <InputComp/>
        <Footer/>
        <ExportedFooter/>
    </div>;
}

export function AnotherDialog() {
    const InputComp = getInput();

    return <div>
        <h1>Hello</h1>
        <InputComp/>
        <ExportedFooter/>
    </div>;
}
