import React from "react";
import { Button } from "ds";
import { RedeclaredButton } from "./redeclare-and-export";

const RedeclaredComponent = Button;
const RedeclaredExternalComponentFromDifferentFile = RedeclaredButton;
export function RedeclareImport() {
    return (
        <>
            <RedeclaredComponent/>
            <Button />
            <RedeclaredExternalComponentFromDifferentFile/>
        </>
    );
}
