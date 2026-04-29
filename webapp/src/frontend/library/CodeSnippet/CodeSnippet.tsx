import { type ReactNode, type PropsWithChildren, useState, useEffect } from "react";

import classNames from "classnames";

import { IconCopy } from "../icons/IconCopy";
import { SegmentedControl, SegmentedControlType } from "../SegmentedControl/SegmentedControl";

import classes from "./CodeSnippet.module.css";

interface CodeSnippetProps {
    className?: string;
    code: string;
    topContent?: ReactNode;
    disableCopy?: boolean;
}

function CodeSnippet({
    className,
    code,
    topContent,
    disableCopy = false,
    children,
}: PropsWithChildren<CodeSnippetProps>) {
    const [isTooltipVisible, setIsTooltipVisible] = useState(false);

    function handleCopyClick() {
        navigator.clipboard.writeText(code);

        setIsTooltipVisible(true);
        window.setTimeout(() => {
            setIsTooltipVisible(false);
        }, 1500);
    }

    return (
        <div className={classNames(classes.codeSnippet, className)}>
            <div className={classes.snippet}>
                {topContent}
                <pre><code>{children ?? code}</code></pre>
            </div>
            {!disableCopy && (
                <button
                    className={classes.copyButton}
                    type="button"
                    onClick={handleCopyClick}>
                    <IconCopy/>
                </button>
            )}
            <div className={classNames(classes.copiedTooltip, { [classes.visible]: isTooltipVisible })}>
                Copied!
            </div>
        </div>
    );
}

interface SingleCodeSnippetProps {
    className?: string;
    code: string;
    children?: ReactNode;
    disableCopy?: boolean;
}

function SingleCodeSnippet({ className, code, disableCopy, children }: PropsWithChildren<SingleCodeSnippetProps>) {
    return (
        <CodeSnippet className={className} code={code} disableCopy={disableCopy}>
            {children}
        </CodeSnippet>
    );
}

interface TabbedCodeSnippetProps<L extends string> {
    className?: string;
    code: Record<L, string>;
    language?: L;
    onLanguageChange?(language: L): void;
}

function TabbedCodeSnippet<L extends string>({ className, code, language, children, onLanguageChange }: PropsWithChildren<TabbedCodeSnippetProps<L>>) {
    const [selectedLanguage, setSelectedLanguage] = useState(language ?? Object.keys(code)[0] as L);

    function handleLanguageChange(lang: L) {
        setSelectedLanguage(lang);
        onLanguageChange?.(lang);
    }

    useEffect(() => {
        setSelectedLanguage(language ?? Object.keys(code)[0] as L);
    }, [JSON.stringify(code), language]);

    return (
        <CodeSnippet
            className={className}
            code={code[selectedLanguage]}
            topContent={
                <SegmentedControl
                    className={classes.languages}
                    type={SegmentedControlType.Compact}
                    value={selectedLanguage}
                    onChange={handleLanguageChange}>
                    {Object.keys(code).map(lang =>
                        <SegmentedControl.Option key={lang} value={lang}>
                            {lang}
                        </SegmentedControl.Option>
                    )}
                </SegmentedControl>
            }>
            {children}
        </CodeSnippet>
    );
}

SingleCodeSnippet.Tabbed = TabbedCodeSnippet;

export { SingleCodeSnippet as CodeSnippet };
