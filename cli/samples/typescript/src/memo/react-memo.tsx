import React from "react";

function ReactMemoComponent() {
    return <div>Preact memo component</div>;
}

export default React.memo(ReactMemoComponent);
