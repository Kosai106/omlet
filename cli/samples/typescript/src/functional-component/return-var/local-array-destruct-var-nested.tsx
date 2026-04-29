import React from "react";

const props = [42, [<div>Sample</div>]];

export default function Sample() {
    const [notComponent, [component]] = props;

    return component;
}
