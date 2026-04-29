import React from "react";

const props = [0, [0, 1, [0, 1, 2, <div>Sample</div>]]];

export default function Sample() {
    const [, [, , [, , , component]]] = props;

    return component;
}
