import React from "react";

function generateComponent() {
    return <div>Sample</div>;
}

export default function Sample() {
    return generateComponent2();
}

function generateComponent2() {
    return generateComponent();
}
