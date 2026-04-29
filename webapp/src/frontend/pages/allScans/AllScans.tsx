import { useState } from "react";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";

import { getAnalyses, deleteAnalysis, getWorkspace as getWorkspaceBySlug } from "../../api/api";
import { H2 } from "../../library/Heading/Heading";
import { logError } from "../../logger";
import { AccessLevel } from "../../models/AccessLevel";
import { type AnalysesResponse } from "../../models/AnalysesResponse";
import { type GetAnalysesParams } from "../../models/GetAnalysesParams";
import { useStore } from "../../providers/StoreProvider/StoreProvider";
import { formatDate } from "../../utils";

import { Analyses } from "./analyses/Analyses";
import { AnalysesLoading } from "./analyses/AnalysesLoading";

import classes from "./AllScans.module.css";

const LIMIT = 50;

export function AllScans() {
    const navigate = useNavigate();
    const { workspaceSlug } = useParams();
    const {
        selectors: { getAccessLevel, getWorkspace },
        actions: { setWorkspace },
    } = useStore();

    const [isRemoving, setIsRemoving] = useState(false);
    const accessLevel = getAccessLevel();
    const workspace = getWorkspace();

    const { data, hasNextPage, isPending, isFetchingNextPage, fetchNextPage, refetch } = useInfiniteQuery({
        queryKey: [
            "analyses",
            workspaceSlug,
        ],
        queryFn: async ({ pageParam }) => {
            const params: GetAnalysesParams = {
                limit: String(LIMIT),
            };
            if (pageParam !== undefined) {
                params.next = pageParam;
            }

            try {
                return await getAnalyses(workspaceSlug!, params);
            } catch (error) {
                logError(error);
                throw error;
            }
        },
        initialPageParam: undefined,
        getNextPageParam: ({ next }: AnalysesResponse) => next,
        getPreviousPageParam: ({ prev }: AnalysesResponse) => prev,
    });

    function handleEnd() {
        if (!isFetchingNextPage) {
            fetchNextPage();
        }
    }

    async function fetchWorkspace() {
        try {
            const { workspace, accessLevel } = await getWorkspaceBySlug(workspaceSlug!);

            setWorkspace(workspace, accessLevel);
        } catch (error) {
            navigate("/", { replace: true });
            logError(error);
        }
    }

    async function handleDelete(id: string) {
        const analysis = analyses.find(({ id: aid }) => aid === id)!;
        const scanDate = formatDate(analysis.createdAt, { dateStyle: "medium", timeStyle: "short" });

        try {
            if (window.confirm(`Delete scan on ${scanDate}?`)) {
                setIsRemoving(true);

                await deleteAnalysis(workspaceSlug!, id);
                setIsRemoving(false);
                refetch();

                await fetchWorkspace();
            }
        } catch (error) {
            logError(error);
            setIsRemoving(false);
        }
    }

    if (!workspace) {
        return null;
    }

    const analyses = data?.pages.flatMap((page) => page.analyses) ?? [];

    return (
        <main className={classes.allScans}>
            <H2 className={classes.title}>All Scans</H2>
            {
                isPending ? (
                    <AnalysesLoading/>
                ) : (
                    <Analyses
                        analyses={analyses}
                        hasNextPage={hasNextPage}
                        readOnly={accessLevel !== AccessLevel.Full}
                        isRemoving={isRemoving}
                        isFetchingNextPage={isFetchingNextPage}
                        analysisInProgress={workspace.analysisInProgress}
                        onEnd={handleEnd}
                        onDelete={handleDelete}/>
                )
            }
        </main>
    );
}
