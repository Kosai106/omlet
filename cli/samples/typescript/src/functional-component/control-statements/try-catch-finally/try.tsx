import React from "react";

export function Sample() {
    try {
        return <div>Sample</div>;
    } catch {
        return 42;
    }
}
