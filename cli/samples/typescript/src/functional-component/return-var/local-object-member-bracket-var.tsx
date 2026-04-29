import React from "react";

const props = {
    number: 42,
    component: <div>Sample</div>
};

export default function Sample() {
    const component = props["component"];

    return component;
}
