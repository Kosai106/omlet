import { type PropValueType } from "./PropValueType";

export enum ObjectPropType {
    KeyValue = "KeyValue",
    Shorthand = "Shorthand",
    Spread = "Spread",
}

export type ObjectProp = {
    type: ObjectPropType.KeyValue;
    key: string;
    value: PropValue;
} | {
    type: ObjectPropType.Shorthand;
    key: string;
} | {
    type: ObjectPropType.Spread;
    value: PropValue;
};

export type PropValue = {
    type: PropValueType.String | PropValueType.Identifier;
    value: string;
} | {
    type: PropValueType.Number;
    value: number;
} | {
    type: PropValueType.Bool;
    value: boolean;
} | {
    type: PropValueType.Regex;
    value: string;
    flags: string;
} | {
    type: PropValueType.Array;
    values: PropValue[];
} | {
    type: PropValueType.Spread;
    value: PropValue;
} | {
    type: PropValueType.Member;
    value: PropValue;
    property: PropValue;
} | {
    type: PropValueType.Object;
    props: ObjectProp[];
} | {
    type: PropValueType.Null | PropValueType.JSXElement | PropValueType.Function | PropValueType.Getter | PropValueType.Setter | PropValueType.This | PropValueType.Super | PropValueType.TemplateLiteral | PropValueType.Expression;
};
