import React from "react";

export function Sample(type?: string) {
    switch (type) {
        case "one":
            return "One";

        case "two": {
            return 2;
        }

        default:
            return <div>Default</div>;
    }
}
