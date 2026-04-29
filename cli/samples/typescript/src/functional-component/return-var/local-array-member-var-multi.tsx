import React from "react";

const props = [0, [0, 1, [<div>Sample</div>]]];

export default function Sample() {
    const component = props[1][2][0];

    return component;
}
