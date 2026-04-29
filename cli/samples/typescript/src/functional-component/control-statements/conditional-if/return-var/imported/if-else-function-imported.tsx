import React from "react";
import { returnFortyTwo, renderSample } from "./utils";

export function Sample(bool: boolean) {
    let result;

    if (bool) {
        result = returnFortyTwo();
    } else {
        result = renderSample();
    }

    return result;
}
