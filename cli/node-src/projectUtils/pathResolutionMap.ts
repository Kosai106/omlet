export enum PathResolutionEntryType {
    Export = "export",
    Alias = "alias",
    Import = "import",
}

export interface PathResolutionEntry {
    name: string;
    patterns: string[];
    type: PathResolutionEntryType;
    sourcePath: string;
}

export class PathResolutionMap {
    private aliases: Record<string, Set<string>>;
    private entrySourcePaths: Record<string, string>;
    private entryType: PathResolutionEntryType;

    constructor(entryType: PathResolutionEntryType) {
        this.aliases = {};
        this.entryType = entryType;
        this.entrySourcePaths = {};
    }

    hasEntry(name: string): boolean {
        return (this.aliases[name]?.size ?? 0) > 0;
    }

    getEntry(name: string): PathResolutionEntry | undefined {
        const patterns = this.aliases[name];
        if (patterns) {
            return this.aliases[name] && {
                name,
                patterns: [...this.aliases[name]],
                type: this.entryType,
                sourcePath: this.entrySourcePaths[name],
            };
        }
    }

    entries(): PathResolutionEntry[] {
        return Object.entries(this.aliases).map(
            ([name, patterns]) => ({
                name,
                patterns: [...patterns],
                sourcePath: this.entrySourcePaths[name],
                type: this.entryType,
            })
        );
    }

    addMapping(name: string, paths: string | string[], sourcePath: string) {
        if (!this.aliases[name]) {
            this.aliases[name] = new Set();
        }

        this.entrySourcePaths[name] = sourcePath;

        const pathArray = Array.isArray(paths) ? paths : [paths];

        for (const p of pathArray) {
            this.aliases[name].add(p);
        }
    }

    merge(...others: PathResolutionMap[]): PathResolutionMap {
        for (const config of others) {
            for (const entry of config.entries()) {
                this.addMapping(entry.name, entry.patterns, entry.sourcePath);
            }
        }

        return this;
    }
}
