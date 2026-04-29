import React from "react";

const component = <div>Sample</div>;

const props = {
    number: 42,
    component
};

export default function Sample() {
    return props.component;
}
