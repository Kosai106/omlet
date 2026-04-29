import React from "react";

function generateComponent() {
    return <div>Sample</div>;
}

function generateComponent2() {
    return generateComponent();
}

export default function Sample() {
    return generateComponent2();
}
