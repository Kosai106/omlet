import React from "react";

export function Sample(bool: boolean) {
    if (bool) {
        return 42;
    } else {
        return <div>Sample</div>;
    }
}
