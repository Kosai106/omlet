import React from "react";

const props = {
    generateComponent: () => {
        return <div>Sample</div>;
    }
};

export default function Sample() {
    const { generateComponent } = props;

    return generateComponent();
}
