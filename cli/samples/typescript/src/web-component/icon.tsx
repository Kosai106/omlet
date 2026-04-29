import * as React from "react";
import { createComponent } from "@lit-labs/react";
import Icon from "./icon.vanilla";

const ReactIcon = createComponent({
    tagName: "nb-icon",
    elementClass: Icon,
    react: React
});

export default ReactIcon;
