import { type ReactNode, useMemo } from "react";

import { type Emoji } from "emoji-type";
import { Link, generatePath, useParams } from "react-router-dom";

import { RoutePath } from "../../../../common/RoutePath";
import { Callout, CalloutKind } from "../../../library/Callout/Callout";
import { PredefinedTableType } from "../constants";
import { type RowData } from "../paginatedTable/PaginatedTable";

function CompleteListInsightContent({ workspaceSlug }: { workspaceSlug: string; }) {
    return (
        <>
            Looking for the complete list of unused props?{" "}
            <Link to={{ pathname: generatePath(RoutePath.Props, { workspaceSlug }), search: "?usage=unused" }}>
                View all unused props
            </Link>
            .
        </>
    );
}

interface Props {
    className?: string;
    tableType: PredefinedTableType;
    data: RowData[] | null | undefined;
    showCompleteListInsight: boolean;
}

interface InsightContent {
    kind?: CalloutKind;
    emoji?: Emoji;
    insight: ReactNode;
}

export function TableInsight({
    tableType,
    data,
    showCompleteListInsight,
}: Props) {
    const { workspaceSlug } = useParams();

    function getUnusedComponentPropsInsight(): InsightContent {
        if (showCompleteListInsight) {
            return {
                kind: CalloutKind.Onboarding,
                emoji: "🧐",
                insight: <CompleteListInsightContent workspaceSlug={workspaceSlug!}/>,
            };
        }

        return {
            insight: "Consider removing the prop to simplify the component and improve usability.",
        };
    }

    function getLeastUsedCoreComponentsInsight(): InsightContent {
        return {
            insight: "Consider removing these components to simplify the library and reduce maintenance overhead!",
        };
    }

    function getPredefinedTableInsight(): InsightContent | null {
        if (data === null || data?.length === 0) {
            return null;
        }

        switch (tableType) {
            case PredefinedTableType.UnusedComponentProps:
                return getUnusedComponentPropsInsight();

            case PredefinedTableType.LeastUsedCoreComponents:
                return getLeastUsedCoreComponentsInsight();

            default:
                return null;
        }
    }

    const { kind, emoji, insight } = useMemo(() => getPredefinedTableInsight() ?? { insight: null }, [tableType, data, showCompleteListInsight, workspaceSlug]);

    if (!insight) {
        return null;
    }

    return (
        <Callout kind={kind} emoji={emoji ?? "🧹"}>
            {insight}
        </Callout>
    );
}
