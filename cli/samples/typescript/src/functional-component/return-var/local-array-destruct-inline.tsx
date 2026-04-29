import React from "react";

export default function Sample() {
    const [, component, , notComponent] = ["text", <div>Sample</div>, 3, 42];

    return component;
}
