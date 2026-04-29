import React from "react";

export function Sample(bool: boolean) {
    if (bool) {
        return <div>Sample</div>;
    } else {
        return 42;
    }
}
