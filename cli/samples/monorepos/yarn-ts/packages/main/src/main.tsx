import React from "react";

import { concatStrings, SinglePartMain } from "single-part";
import MultiPart, { DotGrid } from "multi-part";
import RcaPlayer from "multi-part/rca-victor";
import { Button } from "comps";
import { IgnoredComponent } from "ignored-package";
import { IgnoredComponentInMappedExport } from "ignored-package/package-entry/mapped-export"
import Title  from "comps/src/title";
import { logResult } from "./helper";


export default function Main() {
    logResult("no result");

    return <MultiPart>
        <SinglePartMain content={concatStrings("a", "b")}/>
        <DotGrid/>
        <RcaPlayer/>
        <Title/>
        <Button/>
        <IgnoredComponent/>
        <IgnoredComponentInMappedExport/>
    </MultiPart>;
}

export function Component() {
    return <div></div>;
}
