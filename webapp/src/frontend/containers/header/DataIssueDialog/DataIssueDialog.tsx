import { Fragment, useState } from "react";

import { outdent } from "outdent";

import { type Repository } from "../../../../common/models/Repository";
import { compareString } from "../../../../common/sortUtils";
import { pluralize } from "../../../../common/utils";
import { Quote, QuoteKind } from "../../../common/Quote/Quote";
import { CodeSnippet } from "../../../library/CodeSnippet/CodeSnippet";
import { Dialog } from "../../../library/Dialog/Dialog";
import { H2, H3 } from "../../../library/Heading/Heading";
import { IconWarning } from "../../../library/icons/IconWarning";
import { type AliasIssue } from "../../../models/AliasIssue";
import { type DataIssue } from "../../../models/DataIssue";
import { getHumanReadableURL } from "../../../utils";

import classes from "./DataIssueDialog.module.css";

const SHOW_MORE_THRESHOLD = 6;

function generateSampleConfig(mapName: string, keys: string[], packageName?: string) {
    if (packageName){
        return outdent`
            {
              "workspaces": {
                "${packageName}": {
                  "${mapName}": {
            ${keys.map(key => `        "${key}": […]`).join(",\n")}
                  }
                }
              }
            }`;
    }

    return outdent`
        {
          "${mapName}": {
        ${keys.map(key => `    "${key}": […]`).join(",\n")}
          }
        }`;
}

interface SampleConfigProps {
    packageName?: string;
    mapName: string;
    keys: string[];
}

function SampleConfig({ packageName, mapName, keys }: SampleConfigProps) {
    if (packageName) {
        return (
            <>
                {"{"}
                <br/>
                {"  \"workspaces\": {"}
                <br/>
                {`    "${packageName}": {`}
                <br/>
                {`      "${mapName}": {`}
                <br/>
                {keys.map((key, i) => (
                    <Fragment key={key}>
                        {`        "${key}": `}
                        <span className={classes.placeholder}>
                            […]
                        </span>
                        {i < keys.length - 1 && ","}
                        <br/>
                    </Fragment>
                ))}
                {"      }"}
                <br/>
                {"    }"}
                <br/>
                {"  }"}
                <br/>
                {"}"}
            </>
        );
    }

    return (
        <>
            {"{"}
            <br/>
            {`  "${mapName}": {`}
            <br/>
            {keys.map((key, i) => (
                <Fragment key={key}>
                    {`    "${key}": `}
                    <span className={classes.placeholder}>
                        […]
                    </span>
                    {i < keys.length - 1 && ","}
                    <br/>
                </Fragment>
            ))}
            {"  }"}
            <br/>
            {"}"}
        </>
    );
}

interface IssuesCodeSnippetProps {
    issues: string[];
}

function IssuesCodeSnippet({ issues }: IssuesCodeSnippetProps) {
    const [showMoreClicked, setShowMoreClicked] = useState(false);
    const showAll = issues.length <= SHOW_MORE_THRESHOLD || showMoreClicked;
    const visibleIssues = showAll ? issues : issues.slice(0, SHOW_MORE_THRESHOLD);

    function handleShowMoreClick() {
        setShowMoreClicked(true);
    }
    return (
        <CodeSnippet
            className={classes.issues}
            code={issues.join("\n")}
            disableCopy>
            <div className={classes.column}>
                {visibleIssues.join("\n")}
                {!showAll && (
                    <button
                        className={classes.showMoreButton}
                        type="button"
                        onClick={handleShowMoreClick}>
                        Show more
                    </button>
                )}
            </div>
        </CodeSnippet>
    );
}

interface SuggestionTextProps {
    field: string;
    repository?: Repository;
}

function SuggestionText({ repository, field }: SuggestionTextProps) {
    return (
        <p>
            Define
            {" "}
            {field}
            {" "}
            in the Omlet config file (
            <span className={classes.code}>
                .omletrc
            </span>
            ) in
            {" "}
            {repository?.url
                ? (
                    <>
                        repo
                        {" "}
                        <a className={classes.code} href={repository.url} target="_blank">
                            {getHumanReadableURL(repository.url)}
                        </a>
                    </>
                ) : " your repo"
            }
            :
        </p>
    );
}

interface AliasIssueCodeSnippetProps {
    aliasIssues: AliasIssue[];
    packageName?: string;
}

function AliasIssueCodeSnippet({ aliasIssues, packageName }: AliasIssueCodeSnippetProps) {
    const aliasKeys = new Set<string>();
    for (const { packageName, path } of aliasIssues) {
        aliasKeys.add(path ? `${packageName}/*` : packageName);
    }

    const aliasKeysArray = [...aliasKeys];

    const code = generateSampleConfig("aliases", aliasKeysArray, packageName);

    return (
        <CodeSnippet className={classes.exampleSolution} code={code}>
            <SampleConfig packageName={packageName} mapName="aliases" keys={aliasKeysArray}/>
        </CodeSnippet>
    );
}
interface ExportIssueCodeSnippetProps {
    exportIssues: string[];
    packageName?: string;
}

function ExportIssueCodeSnippet({ exportIssues, packageName }: ExportIssueCodeSnippetProps) {
    const exports = new Set<string>();
    for (const path of exportIssues) {
        const [parentFolder, ...rest] = (path || ".").split("/");
        exports.add(rest.length > 0 ? `${parentFolder}/*` : parentFolder);
    }

    const exportsArray = [...exports];

    const code = generateSampleConfig("exports", exportsArray, packageName);

    return (
        <CodeSnippet className={classes.exampleSolution} code={code}>
            <SampleConfig packageName={packageName} mapName="exports" keys={exportsArray}/>
        </CodeSnippet>
    );
}

function compareDataIssues(a: DataIssue, b: DataIssue) {
    const compareRepoUrl = compareString(a.project.repository?.url ?? "", b.project.repository?.url ?? "");

    if (compareRepoUrl !== 0) {
        return compareRepoUrl;
    }

    const compareCommitHash = compareString(a.project.repository?.initialCommitHash ?? "", b.project.repository?.initialCommitHash ?? "");

    if (
        a.project.repository?.url === undefined
        && b.project.repository?.url === undefined
        && compareCommitHash !== 0
    ) {
        return compareCommitHash;
    }

    return compareString(
        a.project.packageName,
        b.project.packageName
    );
}

interface Props {
    dataIssues: DataIssue[];
    dataIssueCount: number;
    onClose(): void;
}
export function DataIssueDialog({
    dataIssues,
    dataIssueCount,
    onClose,
}: Props) {

    return (
        <Dialog onClose={onClose} className={classes.dataIssueDialog}>
            <H2 className={classes.heading}>
                {pluralize("issue", dataIssueCount)} in recent scans
            </H2>
            <p>
                In your recent scans, Omlet ran into
                {" "}
                {pluralize("issue", dataIssueCount)}
                {" "}
                that might affect data accuracy.
                Please review them below, follow the instructions and scan again.
                <br/>
                <br/>
                {" "}
                if find anything confusing or have any questions — we’re happy to help!
            </p>
            {dataIssues
                .sort(compareDataIssues)
                .map((dataIssue) => (
                    <div key={dataIssue.project.slug} className={classes.dataIssue}>
                        <H2 className={classes.title}>
                            <span>
                                {dataIssue.project.name}
                            </span>
                            {dataIssue.project.repository?.url && (
                                <span className={classes.repositoryText}>
                                    {getHumanReadableURL(dataIssue.project.repository.url)}
                                </span>
                            )}
                        </H2>
                        {dataIssue.aliasIssues.length > 0 && (
                            <Quote className={classes.detail} kind={QuoteKind.Warning}>
                                <div>
                                    <H3 className={classes.issueDetailTitle}>
                                        <IconWarning />
                                        Could not recognize aliases
                                    </H3>
                                    <p>
                                        Looks like your project is using custom aliases,
                                        but some of these aliases could not be recognized by Omlet.
                                        The following are causing data issues:
                                    </p>
                                    <IssuesCodeSnippet
                                        issues={dataIssue.aliasIssues.map(({ packageName, path }) => (
                                            path ? `${packageName}/${path}` : packageName)
                                        )}/>
                                    <Quote className={classes.suggestion} kind={QuoteKind.Informative}>
                                        <div>
                                            <H3 className={classes.suggestionTitle}>
                                                How can I solve the issue?
                                            </H3>
                                            <SuggestionText repository={dataIssue.project.repository} field="aliases"/>
                                            <AliasIssueCodeSnippet
                                                aliasIssues={dataIssue.aliasIssues}
                                                packageName={
                                                    dataIssue.isMonorepo
                                                        ? dataIssue.project.packageName
                                                        : undefined}/>
                                            <a className={classes.docLink} href="/l/docs/alias-issues" target="_blank">
                                                See docs for more detail
                                            </a>
                                        </div>
                                    </Quote>
                                </div>
                            </Quote>
                        )}
                        {dataIssue.exportIssues.length > 0 && (
                            <Quote className={classes.detail} kind={QuoteKind.Warning}>
                                <div>
                                    <H3 className={classes.issueDetailTitle}>
                                        <IconWarning />
                                        Could not map exports
                                    </H3>
                                    <p>
                                        Imports couldn’t be resolved for the following entry points
                                        —
                                        this usually happens when the package is built and used as an external dependency.
                                    </p>
                                    <IssuesCodeSnippet issues={dataIssue.exportIssues.map(path => path || ".")} />
                                    <Quote className={classes.suggestion} kind={QuoteKind.Informative}>
                                        <div>
                                            <H3 className={classes.suggestionTitle}>
                                                How can I solve the issue?
                                            </H3>
                                            <SuggestionText repository={dataIssue.project.repository} field="exports"/>
                                            <ExportIssueCodeSnippet
                                                exportIssues={dataIssue.exportIssues}
                                                packageName={
                                                    dataIssue.isMonorepo
                                                        ? dataIssue.project.packageName
                                                        : undefined}/>
                                            <a className={classes.docLink} href="/l/docs/export-issues" target="_blank">
                                                See docs for more detail
                                            </a>
                                        </div>
                                    </Quote>
                                </div>
                            </Quote>
                        )}
                    </div>
                ))}
        </Dialog>
    );
}
