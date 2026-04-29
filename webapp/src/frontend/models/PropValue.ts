import { PropValueType } from "./PropValueType";

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

export function propValueToString(propValue?: PropValue, indentLevel?: number): string | undefined {
    if (!propValue) {
        return undefined;
    }

    function memberToString(value: PropValue, property: PropValue): string {
        const prefix = (
            [PropValueType.Identifier, PropValueType.This, PropValueType.Super].includes(value.type)
                ? propValueToString(value)
                : `(${propValueToString(value)})`
        );
        return property.type === PropValueType.String ? `${prefix}.${property.value}` : `${prefix}[${propValueToString(property)}]`;
    }

    const indent = "  ".repeat(indentLevel ?? 0);

    switch (propValue.type) {
        case PropValueType.Null:
            return "null";
        case PropValueType.String:
            return `"${propValue.value}"`;
        case PropValueType.Number:
        case PropValueType.Bool:
            return propValue.value.toString();
        case PropValueType.Regex:
            return `/${propValue.value}/${propValue.flags}`;
        case PropValueType.Identifier:
            return propValue.value;
        case PropValueType.JSXElement:
            return "ReactNode";
        case PropValueType.Function:
            return "Function";
        case PropValueType.Getter:
            return "Getter";
        case PropValueType.Setter:
            return "Setter";
        case PropValueType.Object: {
            if (propValue.props) {
                return `{\n${propValue.props
                    .map((objectProp) => {
                        if (objectProp.type === ObjectPropType.KeyValue) {
                            return `${indent}  ${objectProp.key}: ${propValueToString(objectProp.value, (indentLevel ?? 0) + 1)}`;
                        } else if (objectProp.type === ObjectPropType.Shorthand) {
                            return `${indent}  ${objectProp.key}`;
                        } else if (objectProp.type === ObjectPropType.Spread){
                            return `${indent}  ...${propValueToString(objectProp.value, (indentLevel ?? 0) + 1)}`;
                        }
                    }).join(",\n")}\n${indent}}`;
            } else {
                return "Object";
            }
        }
        case PropValueType.Array:
            return "Array";
        case PropValueType.Spread:
            return `...${propValueToString(propValue.value)}`;
        case PropValueType.Member:
            return memberToString(propValue.value, propValue.property);
        case PropValueType.This:
            return "this";
        case PropValueType.Super:
            return "super";
        case PropValueType.TemplateLiteral:
            return "TemplateLiteral";
        case PropValueType.Expression:
            return "Expression";
    }
}
