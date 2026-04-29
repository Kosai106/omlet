import upath from "upath";

import { type Component as ComponentData, type AnalyzeResult } from "../analyzer";
import { CliError } from "../error";
import { pathExists } from "../fileUtils";

type MetadataValue = number | string | boolean | Date;
type Metadata = Record<string, MetadataValue>;

export interface Component {
    /**
     * Unique identifier for the component.
     */
    id: string;

    /**
     * Name of the component as exported in the source code.
     */
    name: string;

    /**
     * Creation date of the component, extracted from the git history. Optional.
     */
    createdAt?: Readonly<Date>;

    /**
     * Last updated date of the component, extracted from the git history. Optional.
     */
    updatedAt?: Readonly<Date>;

    /**
     * Package name the component belongs to.
     */
    packageName: string;

    /**
     * File path to the component within the repository.
     */
    filePath: string;

    /**
     * List of props of the component, including name and optional default value.
     */
    props: readonly {
        name: string;
        defaultValue?: string;
    }[];

    /**
     * List of HTML elements used within the component.
     */
    htmlElementsUsed: readonly string[];

    /**
     * Child components of this component. Includes only the component detected in the scan.
     */
    children: readonly Component[];

    /**
     * Parent components of this component. Includes only the component detected in the scan.
     */
    parents: readonly Component[];

    /**
     * Sets metadata for the component.
     * @param name The name of the metadata field.
     * @param value The value of the metadata field.
     */
    setMetadata: (name: string, value: MetadataValue) => void;
}

export interface CliHookModule {
    /**
     * The hook function that is called after a scan operation is completed.
     * This hook can be used to perform additional processing on the components
     * found during the scan.
     * The function can be synchronous or return a Promise for asynchronous operations.
     *
     * @param components The list of components found during the scan.
     */
    afterScan: (components: readonly Component[]) => void | Promise<void>;
}

export class HookComponent implements Component {
    private context: HookContext;
    private component: ComponentData;
    private _props: Readonly<ComponentData["props"]> | null;
    private _htmlElements: readonly string[] | null;
    private _children: readonly Component[] | null;

    constructor(context: HookContext, component: ComponentData) {
        this.context = context;
        this.component = component;
        this._props = null;
        this._htmlElements = null;
        this._children = null;
    }

    get name(): string {
        return this.component.name;
    }

    get id(): string {
        return this.component.id;
    }

    get createdAt(): Readonly<Date> | undefined {
        return Object.freeze(this.component.created_at);
    }

    get updatedAt(): Readonly<Date> | undefined {
        return Object.freeze(this.component.updated_at);
    }

    get packageName(): string {
        return this.component.source.source.package_name;
    }

    get filePath(): string {
        return this.component.source.source.path;
    }

    get props(): Readonly<ComponentData["props"]> {
        if (this._props === null) {
            this._props = Object.freeze(this.component.props.map(p => Object.freeze(p)));
        }

        return this._props;
    }

    get htmlElementsUsed(): readonly string[] {
        if (this._htmlElements === null) {
            this._htmlElements = Object.freeze(this.component.html_elements);
        }

        return this._htmlElements;
    }

    get children(): readonly Component[] {
        if (this._children === null) {
            this._children = Object.freeze(
                this.component.dependencies.map(d => this.context.getComponent(d.to.id)).filter(c => c !== null) as HookComponent[]
            );
        }

        return this._children;
    }

    get parents(): readonly Component[] {
        return this.context.findParentComponents(this.component.id);
    }

    get metadata(): Readonly<Metadata> | null {
        return Object.freeze(this.context.getComponentMetadata(this.id));
    }

    setMetadata(name: string, value: MetadataValue) {
        this.context.setComponentMetadata(this.id, name, value);
    }
}

export class HookContext {
    private hookModule: CliHookModule;
    private componentMap: Map<string, HookComponent>;
    private reverseDependencyMap: Map<string, string[]>;
    private componentMetadata: Map<string, Metadata>;
    components: HookComponent[];

    constructor(analysisData: AnalyzeResult, hookModule: CliHookModule) {
        this.hookModule = hookModule;
        this.componentMap = new Map();
        this.reverseDependencyMap = new Map();

        for (const sourceComponent of analysisData.components) {
            this.componentMap.set(sourceComponent.id, Object.preventExtensions(new HookComponent(this, sourceComponent)));

            for (const dependency of sourceComponent.dependencies) {
                if (!this.reverseDependencyMap.has(dependency.to.id)) {
                    this.reverseDependencyMap.set(dependency.to.id, []);
                }

                this.reverseDependencyMap.get(dependency.to.id)!.push(sourceComponent.id);
            }
        }

        this.components = Array.from(this.componentMap.values());
        this.componentMetadata = new Map();
    }

    getComponent(id: string): HookComponent | null {
        return this.componentMap.get(id) || null;
    }

    findParentComponents(id: string): HookComponent[] {
        return (this.reverseDependencyMap.get(id) ?? []).map(id => this.getComponent(id)!);
    }

    setComponentMetadata(id: string, name: string, value: MetadataValue) {
        const valueType = typeof value;
        if (valueType !== "number" && valueType !== "string" && valueType !== "boolean" && !(value instanceof Date)) {
            throw new CliHookError(`Setting metadata failed. Invalid value type: ${valueType}. Only string, number, boolean or Date are allowed.`);
        }

        if (value instanceof Date && Number.isNaN(value.getTime())) {
            throw new CliHookError("Setting metadata failed. Invalid Date value.");
        }

        if (!this.componentMetadata.has(id)) {
            this.componentMetadata.set(id, {});
        }

        this.componentMetadata.get(id)![name] = value;
    }

    getComponentMetadata(id: string): Metadata | null {
        return this.componentMetadata.get(id) ?? null;
    }

    async afterScan() {
        try {
            await this.hookModule.afterScan(Object.freeze([...this.components]));
        } catch (err) {
            if (err instanceof CliHookError) {
                throw err;
            }

            throw new CliHookError("Error running afterScan hook", err as Error);
        }
    }
}

export class CliHookError extends CliError {
    readonly reason?: Error;

    constructor(message: string, reason?: Error) {
        super(message, {
            context: { reason },
        });
        this.name = this.constructor.name;
        this.reason = reason;
    }
}

export async function init(hookScriptPath: string, analysisData: AnalyzeResult) {
    const absScriptPath = upath.resolve(process.cwd(), hookScriptPath);
    if (!await pathExists(absScriptPath)) {
        throw new CliHookError(`Hook script could not be found at ${absScriptPath}`);
    }

    const hookModule = (await import(absScriptPath)) as CliHookModule;
    if (typeof hookModule.afterScan !== "function") {
        throw new CliHookError(`The script (${absScriptPath}) has no exported function called afterScan`);
    }

    return new HookContext(analysisData, hookModule);
}
