import React from "react";

export function Sample() {
    for (const i in { key: "value", Sample: "Sample" }) {
        if (i === "Sample") {
            return <div>{i}</div>;
        }
    }

    return 42;
}
