import React from "react";
import { IgnoredComponent } from "ignored-package";
import { IgnoredComponentInMappedExport } from "ignored-package/package-entry/mapped-export"

export default function MultiPartMain() {
  return (
    <>
      <IgnoredComponent/>
      <IgnoredComponentInMappedExport/>
      <main>'This is multi-part main'</main>
    </>
  );
}

export { default as DotGrid } from "./rhodia";
