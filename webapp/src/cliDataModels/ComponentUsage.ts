import { type CharacterPosition } from "./CharacterPosition";
import { type ComponentPropUsage } from "./ComponentPropUsage";

export interface ComponentUsage {
    start: CharacterPosition;
    end: CharacterPosition;
    props: ComponentPropUsage[];
}
