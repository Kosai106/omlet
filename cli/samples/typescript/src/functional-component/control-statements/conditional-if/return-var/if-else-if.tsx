import React from "react";

export function Sample(bool?: boolean) {
    let result;

    if (bool === undefined) {
        result = null;
    } else if (bool) {
        result = <div>Sample</div>;
    } else {
        result = 42;
    }

    return result;
}
