import { type PropValue } from "./PropValue";

export interface ComponentProp {
    name: string;
    defaultValue?: PropValue;
    numberOfUsages: number;
    numberOfValues: number;
    values: {
        name: string;
        numberOfUsages: number;
    }[];
}
