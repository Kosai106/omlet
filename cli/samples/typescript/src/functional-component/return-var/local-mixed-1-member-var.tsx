import React from "react";

const props = [{
    number: 42
}, {
    component: <div>Sample</div>
}];

export default function Sample() {
    const component = props[1].component;

    return component;
}
