import { memo } from "preact/compat";

function PreactMemoComponent() {
    return <div>Preact memo component</div>;
}

export default memo(PreactMemoComponent);
