import React from "react";

export function Sample(type?: string) {
    switch (type) {
        case "one":
            return <div>One</div>;

        case "two": {
            return <div>Two</div>;
        }
    }

    return 42;
}
