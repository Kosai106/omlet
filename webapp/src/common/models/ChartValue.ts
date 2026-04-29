import { type To } from "react-router-dom";

export interface ChartValue {
    id: string;
    name: string;
    extra?: string;
    value: number;
    color?: string;
    link?: To;
    tags?: string[];
}
