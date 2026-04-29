import React from "react";

export default function Sample() {
    return generateComponent2();
}

function generateComponent2() {
    return generateComponent();
}

function generateComponent() {
    return <div>Sample</div>;
}
