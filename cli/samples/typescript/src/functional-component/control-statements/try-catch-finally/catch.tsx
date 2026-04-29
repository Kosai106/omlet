import React from "react";

export function Sample() {
    try {
        return 42;
    } catch {
        return <div>Sample</div>;
    }
}
