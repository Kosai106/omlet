import { type ModuleId } from "./ModuleId";

export interface Declaration {
    symbol: string;
    source: ModuleId;
    definition: unknown;
    is_component: unknown;
}
