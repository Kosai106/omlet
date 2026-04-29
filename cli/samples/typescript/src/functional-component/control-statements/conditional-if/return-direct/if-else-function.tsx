import React from "react";

function returnFortyTwo() {
    return 42;
}

function renderSample() {
    return <div>Sample</div>;
}

export function Sample(bool: boolean) {
    if (bool) {
        return returnFortyTwo();
    } else {
        return renderSample();
    }
}
