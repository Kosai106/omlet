import React from "react";
import { DatePicker } from "@wildcard-exports/design-system-react";
import { Input } from "@wildcard-exports/design-system-react";
import { Button } from "@wildcard-exports/design-system-react";
import { Form } from "@wildcard-exports/design-system-react";

export function RightPanel() {
    return <div><h1>right panel</h1><DatePicker/><Input/></div>;
}

export function SearchBar() {
    return <div><h1>search bar</h1><Input/><Button/></div>;
}

export function MainForm() {
    return <Form/>
}
