import React from "react";

export function Sample(type?: string) {
    let result = 42;

    switch (type) {
        case "one":
            result = <div>One</div>;
            break;

        case "two": {
            result = <div>Two</div>;
            break;
        }
    }

    return result;
}
