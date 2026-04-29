import React from "react";

export function Sample() {
    for (const i of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]) {
        if (i === 5) {
            return <div>Sample</div>;
        }
    }

    return 42;
}
