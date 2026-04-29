import { Button } from "comps";
import { Button as SecondButton } from "comps/src/component/button";

export default function PackBTitle() {
    return <h1>Hello World<Button></Button></h1>;
}

export function SecondTitle() {
    return <h1>Hello World<SecondButton></SecondButton></h1>;
}
