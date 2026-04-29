import React from "react";

export default function Sample() {
    const [, [component]] = [42, [<div>Sample</div>]];

    return component;
}
