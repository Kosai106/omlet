import React from "react";

export function Sample() {
    let i = 0;

    while (i++ < 10) {
        if (i === 5) {
            return <div>Sample</div>;
        }
    }
}
