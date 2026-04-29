import micromatch from "micromatch";
import upath from "upath";

import { type Config } from "../config";
import { CliError } from "../error";

import { type PathResolutionEntry, PathResolutionEntryType } from "./pathResolutionMap";
import { type ProjectSetupResolver, type PackageData, type ProjectSetup, starPatternToGlob } from "./projectUtils";

export enum ResolutionConfigIssueType {
    TargetNotExist = "TARGET_NOT_EXIST",
    TargetNotIncluded = "TARGET_NOT_INCLUDED",
}

export enum ResolutionConfigIssueLevel {
    Error = "ERROR",
    Warning = "WARNING",
}

export interface ResolutionConfigIssue {
    packageName: string;
    entry: PathResolutionEntry;
    type: ResolutionConfigIssueType;
    level: ResolutionConfigIssueLevel;
}

export class InvalidProjectSetup extends CliError {
    readonly issues: ResolutionConfigIssue[];

    constructor(message: string, data: { issues?: ResolutionConfigIssue[]; extra?: Record<string, unknown>; }) {
        super(message, { context: data });

        this.issues = data.issues ?? [];
    }

    get level() {
        if (this.issues.length > 0 && !this.issues.some(issue => issue.level === ResolutionConfigIssueLevel.Error)) {
            return ResolutionConfigIssueLevel.Warning;
        } else {
            return ResolutionConfigIssueLevel.Error;
        }
    }
}

type EntryWithoutSource = Omit<PathResolutionEntry, "sourcePath">;

class ProjectSetupValidator {
    private readonly resolver: ProjectSetupResolver;
    private readonly projectRoot: string;
    private readonly config: Config;

    constructor(resolver: ProjectSetupResolver) {
        this.resolver = resolver;
        this.projectRoot = resolver.projectRoot;
        this.config = resolver.userConfig;
    }

    findEntrySource(pkgName: string, entry: EntryWithoutSource) {
        const pkg = this.resolver.findPackageByName(pkgName);
        if (!pkg) {
            throw new InvalidProjectSetup(`Package ${pkgName}' not found in project setup`, { extra: { pkgName, entry } });
        }

        let source;
        if (entry.type === PathResolutionEntryType.Alias) {
            source = pkg.aliases.getEntry(entry.name)?.sourcePath;
        } else if (entry.type === PathResolutionEntryType.Export) {
            source = pkg.exportMap.getEntry(entry.name)?.sourcePath;
        }

        if (!source) {
            throw new InvalidProjectSetup("Entry source not found in the project setup", { extra: { pkgName, entry } });
        }

        return source;
    }

    async checkResolutionEntry(pkg: PackageData, entry: EntryWithoutSource) {
        const { patterns, type } = entry;
        const globBase = type === PathResolutionEntryType.Export ? pkg.path : undefined;
        const matches = await this.resolver.findGlobMatchesInProject(patterns.flatMap(p => starPatternToGlob(p, true)), globBase);

        if (!matches) {
            return;
        }

        if (matches.length === 0) {
            return {
                packageName: pkg.name,
                entry: {
                    ...entry,
                    sourcePath: this.findEntrySource(pkg.name, entry),
                },
                type: ResolutionConfigIssueType.TargetNotExist,
                level: ResolutionConfigIssueLevel.Error,
            };
        }

        const isMatchIncluded = micromatch.some(matches, this.config.include, { ignore: this.config.ignore });
        if (!isMatchIncluded) {
            return {
                packageName: pkg.name,
                entry: {
                    ...entry,
                    sourcePath: this.findEntrySource(pkg.name, entry),
                },
                type: ResolutionConfigIssueType.TargetNotIncluded,
                level: ResolutionConfigIssueLevel.Warning,
            };
        }
    }

    async validateResolutionEntries(pkg: PackageData, entries: EntryWithoutSource[]) {
        const issues: ResolutionConfigIssue[] = [];
        if (entries.length === 0) {
            return issues;
        }

        for (const entry of entries) {
            const issue = await this.checkResolutionEntry(pkg, entry);

            if (issue) {
                issues.push(issue);
            }
        }

        return issues;
    }

    async validatePackage(pkg: PackageData) {
        const issues: ResolutionConfigIssue[] = [];

        const exportMapEntries = Object.entries(pkg.exportMap).map(([name, patterns]) => ({ name, patterns, type: PathResolutionEntryType.Export }));
        issues.push(...await this.validateResolutionEntries(pkg, exportMapEntries));

        const aliasEntries = Object.entries(pkg.aliases).map(([name, patterns]) => ({ name, patterns, type: PathResolutionEntryType.Alias }));
        issues.push(...await this.validateResolutionEntries(pkg, aliasEntries));

        return issues;
    }

    async validate(setup: ProjectSetup) {
        const isPackageIncluded = (pkg: PackageData) => {
            return this.resolver.isGlobIncluded([upath.join(pkg.path, "**/*")]);
        };

        const issues = [];

        for (const pkg of [setup.root, ...Object.values(setup.packages)]) {
            if (await isPackageIncluded(pkg)) {
                issues.push(...await this.validatePackage(pkg));
            }
        }

        if (issues.length > 0) {
            throw new InvalidProjectSetup("Issues found in the project setup", { issues });
        }
    }
}

export function validate(setup: ProjectSetup, resolver: ProjectSetupResolver) {
    const validator = new ProjectSetupValidator(resolver);

    return validator.validate(setup);
}
