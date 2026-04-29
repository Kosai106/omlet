import { type CharacterPosition } from "./CharacterPosition";
import { type Component } from "./Component";
import { type PropUsage } from "./PropUsage";


export interface ComponentUsage {
    component: Pick<Component, "id" | "name" | "path" | "packageName" | "definitionId">;
    start: CharacterPosition;
    end: CharacterPosition;
    props: PropUsage[];
}
