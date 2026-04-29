import React from "react";

function returnFortyTwo() {
    return 42;
}

function renderSample() {
    return <div>Sample</div>;
}

export function Sample(bool: boolean) {
    let result;

    if (bool) {
        result = returnFortyTwo();
    } else {
        result = renderSample();
    }

    return result;
}
