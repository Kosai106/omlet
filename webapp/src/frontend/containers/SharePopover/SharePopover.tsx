import { type ClipboardEvent, useEffect, useState } from "react";

import { createSharedPage, deleteSharedPage, getSharedPage } from "../../api/api";
import { Button } from "../../library/Button/Button";
import { H3 } from "../../library/Heading/Heading";
import { IconCheck } from "../../library/icons/IconCheck";
import { IconLink } from "../../library/icons/IconLink";
import { Popover, PopoverDirection } from "../../library/Popover/Popover";
import { Radio } from "../../library/Radio/Radio";
import { logError } from "../../logger";
import { useStore } from "../../providers/StoreProvider/StoreProvider";
import { getPlainURL } from "../../utils";

import classes from "./SharePopover.module.css";

const COPIED_INDICATOR_TIMEOUT = 1500;

export enum ViewOption {
    Anyone = "anyone",
    Members = "members",
}

export enum PageType {
    Dashboard = "dashboard",
    Analysis = "analysis",
}

interface Props {
    anchor: HTMLElement;
    name: string;
    pageType: PageType;
    onClose(): void;
}

function getSourceURL() {
    const currentURL = new URL(window.location.href);

    if (currentURL.searchParams.has("token")) {
        currentURL.searchParams.delete("token");
    }

    return currentURL;
}

export function SharePopover({
    anchor,
    name,
    pageType,
    onClose,
}: Props) {
    const sourceURL = getSourceURL(); // URL of the current page without the access token
    const [sharedURL, setSharedURL] = useState(window.location.href);
    const [isCopied, setIsCopied] = useState(false);
    const [viewOption, setViewOption] = useState<ViewOption>();

    const { selectors: { getWorkspace } } = useStore();
    const workspace = getWorkspace()!;

    function handleCopyURL(event: ClipboardEvent<HTMLSpanElement>) {
        event.preventDefault();

        event.clipboardData.setData("text/plain", sharedURL);
    }

    function handleCopyShareLink() {
        window.navigator.clipboard.writeText(sharedURL);

        setIsCopied(true);

        window.setTimeout(() => {
            setIsCopied(false);
        }, COPIED_INDICATOR_TIMEOUT);
    }

    async function handleViewOptionChange(option: ViewOption) {
        setViewOption(option);

        try {
            if (option === ViewOption.Members) {
                await deleteSharedPage(workspace.slug, sourceURL.toString());

                setSharedURL(sourceURL.toString());
            } else {
                const sharedPage = await createSharedPage(workspace.slug, sourceURL.toString());

                const newSharedURL = new URL(sourceURL);
                newSharedURL.searchParams.set("token", sharedPage.code);

                setSharedURL(newSharedURL.toString());
            }
        } catch (error) {
            logError(error);
        }
    }

    useEffect(() => {
        async function fetchSharedPage() {
            try {
                const sharedPage = await getSharedPage(workspace.slug, sourceURL.toString());
                const newSharedURL = new URL(sourceURL);

                setViewOption(sharedPage ? ViewOption.Anyone : ViewOption.Members);
                if (sharedPage) {
                    newSharedURL.searchParams.set("token", sharedPage.code);
                }
                setSharedURL(newSharedURL.toString());
            } catch {
                setViewOption(ViewOption.Members);
                setSharedURL(sourceURL.toString());
            }
        }

        fetchSharedPage();
    }, [workspace]);

    if (!viewOption) {
        return null;
    }

    return (
        <Popover
            className={classes.sharePopover}
            anchor={anchor}
            direction={PopoverDirection.BottomLeft}
            onClose={onClose}
            onCancel={onClose}>
            <section className={classes.section}>
                <div>
                    <H3 className={classes.shareHeader}>Share “{name}”</H3>
                    <p className={classes.p}>Share a direct link to this {pageType}</p>
                </div>
                <div className={classes.shareLink}>
                    <IconLink/>
                    <span
                        className={classes.shareLinkURL}
                        title={sharedURL}
                        onClick={handleCopyShareLink}
                        onCopy={handleCopyURL}>
                        {getPlainURL(sharedURL)}
                    </span>
                    <Button
                        className={classes.copyLinkButton}
                        icon={isCopied ? <IconCheck/> : <IconLink/>}
                        onClick={handleCopyShareLink}>
                        {isCopied ? "Copied!" : "Copy link"}
                    </Button>
                </div>
            </section>
            <hr className={classes.separator}/>
            <section className={classes.section}>
                <H3>Who can view this {pageType}?</H3>
                <div className={classes.viewOptions}>
                    <label className={classes.viewOption}>
                        <Radio
                            className={classes.viewOptionRadio}
                            name="viewOption"
                            value={ViewOption.Anyone}
                            checked={viewOption === ViewOption.Anyone}
                            onChange={handleViewOptionChange}/>
                        Anyone with the link
                    </label>
                    <label className={classes.viewOption}>
                        <Radio
                            className={classes.viewOptionRadio}
                            name="viewOption"
                            value={ViewOption.Members}
                            checked={viewOption === ViewOption.Members}
                            onChange={handleViewOptionChange}/>
                        <div>
                            <div>Members of {workspace.name} workspace</div>
                            <p className={classes.p}>To add members, hit “Invite” on the top right</p>
                        </div>
                    </label>
                </div>
            </section>
        </Popover>
    );
}
