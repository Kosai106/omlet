import { useEffect, useMemo, useRef, useState } from "react";

import { generatePath, matchPath, useLocation, useParams } from "react-router-dom";

import { RoutePath } from "../../../../common/RoutePath";
import { PageType, SharePopover } from "../../../containers/SharePopover/SharePopover";
import { Button, ButtonKind, ButtonLink } from "../../../library/Button/Button";
import { IconLink } from "../../../library/icons/IconLink";
import { useStore } from "../../../providers/StoreProvider/StoreProvider";

import { DashboardTabs } from "./dashboardTabs/DashboardTabs";

import classes from "./DashboardHeader.module.css";

export function DashboardHeader() {
    const { workspaceSlug } = useParams();
    const location = useLocation();

    const shareButtonRef = useRef<HTMLButtonElement>(null);
    const createNewAnalysisButtonRef = useRef<HTMLAnchorElement>(null);
    const intersectionObserverRef = useRef<IntersectionObserver>();

    const [sharePopoverOpen, setSharePopoverOpen] = useState(false);

    const pageName = useMemo(() => {
        if (matchPath(RoutePath.SavedCharts, location.pathname) !== null) {
            return "Saved Dashboard";
        } else {
            return "Popular Charts";
        }
    }, [location.pathname]);

    const { actions: { setIsCreateNewAnalysisButtonVisible } } = useStore();

    useEffect(() => {
        if (createNewAnalysisButtonRef.current) {
            intersectionObserverRef.current = new IntersectionObserver(entries => {
                const isIntersecting = entries.some(({ isIntersecting }) => isIntersecting);
                setIsCreateNewAnalysisButtonVisible(!isIntersecting);
            }, {
                root: document,
                rootMargin: "-48px 0px 0px 0px",
            });

            intersectionObserverRef.current.observe(createNewAnalysisButtonRef.current);
        } else {
            intersectionObserverRef.current?.disconnect();
        }

        return () => {
            intersectionObserverRef.current?.disconnect();
            setIsCreateNewAnalysisButtonVisible(false);
        };
    }, []);

    return (
        <header className={classes.dashboardHeader}>
            <DashboardTabs/>
            <div className={classes.actions}>
                <Button
                    ref={shareButtonRef}
                    kind={ButtonKind.Secondary}
                    icon={<IconLink/>}
                    active={sharePopoverOpen}
                    onClick={() => setSharePopoverOpen(true)}>
                    Share dashboard
                </Button>
                <ButtonLink
                    ref={createNewAnalysisButtonRef}
                    to={generatePath(RoutePath.NewAnalytics, { workspaceSlug: workspaceSlug! })}>
                    Create new analysis
                </ButtonLink>
            </div>
            {sharePopoverOpen && (
                <SharePopover
                    anchor={shareButtonRef.current!}
                    name={pageName}
                    pageType={PageType.Dashboard}
                    onClose={() => setSharePopoverOpen(false)}/>
            )}
        </header>
    );
}
