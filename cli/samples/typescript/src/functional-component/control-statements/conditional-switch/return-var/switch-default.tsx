import React from "react";

export function Sample(type?: string) {
    let result;

    switch (type) {
        case "one":
            result = "One";
            break;

        case "two": {
            result = 2;
            break;
        }

        default:
            result = <div>Default</div>;
    }

    return result;
}
