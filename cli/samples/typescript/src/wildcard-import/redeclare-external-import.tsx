import React from "react";
import * as DS from "ds";

const RedeclaredComponent = DS.Button;
const { Button: ComponentFromDestructedObject } = DS;
export function RedeclareExternalImport() {
    return (
        <>
            <RedeclaredComponent/>
            <ComponentFromDestructedObject />
        </>
    );
}
