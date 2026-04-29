import React from "react";

const props = [42, <div>Sample</div>];

export default function Sample() {
    const component = props[1];

    return component;
}
