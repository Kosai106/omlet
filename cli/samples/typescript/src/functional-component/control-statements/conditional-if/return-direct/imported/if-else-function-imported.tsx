import React from "react";
import { returnFortyTwo, renderSample } from "./utils";

export function Sample(bool: boolean) {
    if (bool) {
        return returnFortyTwo();
    } else {
        return renderSample();
    }
}
