import { Fragment } from "react";

import { type TruncateOptions, truncateComponentGenerator } from "./truncateComponentGenerator";

function getTruncatedText({ originalText, ellipsis, width, getTextWidth }: TruncateOptions) : string {
    if (getTextWidth(ellipsis) >= width || getTextWidth(originalText) <= width) {
        return originalText;
    }

    const parts = originalText.split("/").slice(1);
    let result = (parts.length > 0 ? ellipsis + "/" + parts.join("/") : ellipsis + originalText.substring(1 + ellipsis.length));

    while (getTextWidth(result) > width) {
        const parts = result.split("/");
        if (parts.length > 2) {
            result = ellipsis + "/" + parts.slice(2).join("/");
        } else if (parts.length === 2) {
            result = ellipsis + parts[1].substring(1);
        } else {
            result = ellipsis + result.substring(1 + ellipsis.length);
        }
    }
    return result;
}

function getTooltip(path: string) {
    const pathParts = path.split("/");
    return <>
        {pathParts.map((pathPart, i) => (
            <Fragment key={i}>
                {`${pathPart}${i === pathParts.length - 1 ? "" : "/"}`}
                <wbr/>
            </Fragment>
        ))}
    </>;
}

export const TruncatePath = truncateComponentGenerator(getTruncatedText, getTooltip);
