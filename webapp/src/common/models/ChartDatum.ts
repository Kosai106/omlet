import { type To } from "react-router-dom";

import { type ChartValue } from "./ChartValue";

export interface ChartDatum {
    id: string;
    label: string;
    link?: To;
    infoTooltip?: string;
    values: ChartValue[];
}
