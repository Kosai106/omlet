import React from "react";

const props = {
    number: 42,
    component: [42, <div>Sample</div>]
};

export default function Sample() {
    const component = props.component[1];

    return component;
}
