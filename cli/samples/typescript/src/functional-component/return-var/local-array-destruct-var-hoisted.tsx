import React from "react";

export default function Sample() {
    const [notComponent, component] = props;

    return component;
}

// eslint-disable-next-line no-var
var props = [42, <div>Sample</div>];
