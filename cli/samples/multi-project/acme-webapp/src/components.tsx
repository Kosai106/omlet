import React from "react";
import { DatePicker } from "@acme/design-system";
import { Input } from "@acme/design-system";
import { Button } from "@acme/design-system";

export function RightPanel() {
    return <div><h1>right panel</h1><DatePicker/><Input/></div>;
}

export function SearchBar() {
    return <div><h1>search bar</h1><Input/><Button/></div>;
}
