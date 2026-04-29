import React from "react";

export default function Sample() {
    const component = {
        number: 42,
        container: {
            component: <div>Sample</div>
        }
    }["container"]["component"];;

    return component;
}
