import { type CharacterPosition } from "./CharacterPosition";
import { type ComponentDependency } from "./ComponentDependency";
import { type Declaration } from "./Declaration";
import { type PropValue } from "./PropValue";
import { type SymbolWithSource } from "./SymbolWithSource";

export type Component = {
    id: string;
    export_ids: string[];
    name: string;
    package_name: string;
    created_at?: string;
    updated_at?: string;
    type: string;
    source: SymbolWithSource;
    declaration: Declaration;
    dependencies: ComponentDependency[];
    reverse_dependencies: ComponentDependency[];
    props: {
        name: string;
        default_value?: PropValue;
        span?: {
            start: CharacterPosition;
            end: CharacterPosition;
        };
    }[];
    span?: {
        start: CharacterPosition;
        end: CharacterPosition;
    };
    html_elements?: string[];
    html_element_usages?: {
        tag: string;
        count: number;
        spans: {
            start: CharacterPosition;
            end: CharacterPosition;
        }[];
    }[];
    metadata?: Record<string, string | boolean | number | Date>;
};
