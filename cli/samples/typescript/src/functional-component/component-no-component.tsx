import React from "react";

export function NoComponent() {
    return [42];
}

export function MixedComponent() {
    return [<div>Sample</div>];
}

export function Sample() {
    return MixedComponent()[0];
}

