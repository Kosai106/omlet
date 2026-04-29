import React from "react";

const component = <div>Sample</div>;

export default function Sample() {
    let localComponent;
    // eslint-disable-next-line prefer-const
    localComponent = component;

    return localComponent;
}
