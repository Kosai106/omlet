import React from "react";
import * as DS from "./ds";

const RedeclaredComponent = DS.Button;
const { Button: ComponentFromDestructedObject } = DS;
export function RedeclareImport() {
    return (
        <>
            <RedeclaredComponent/>
            <ComponentFromDestructedObject />
        </>
    );
}
