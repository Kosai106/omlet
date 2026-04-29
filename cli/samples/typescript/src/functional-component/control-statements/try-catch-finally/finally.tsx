import React from "react";

export function Sample() {
    try {
        return "try";
    } catch {
        return "catch";
    } finally {
        return <div>Sample</div>;
    }
}
