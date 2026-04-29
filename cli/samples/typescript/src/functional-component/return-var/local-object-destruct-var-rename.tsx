import React from "react";

const props = {
    component: <div>Sample</div>
};

export default function Sample() {
    const { component: renamedComponent } = props;

    return renamedComponent;
}
