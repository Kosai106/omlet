import React from "react";

const props = {
    number: 42,
    get component() {
        return <div>Sample</div>;
    }
};

export default function Sample() {
    return props.component;
}
