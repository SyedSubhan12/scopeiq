import {
    db,
    projects,
    scopeFlags,
    briefs,
    deliverables,
    changeOrders,
    eq,
    and,
    isNull,
    sql,
    count,
    avg,
} from "@novabots/db";

export const analyticsService = {
    async getPortfolioStats(workspaceId: string) {
        // 1. Total Active Projects
        const [activeProjects] = await db
            .select({ value: count() })
            .from(projects)
            .where(
                and(
                    eq(projects.workspaceId, workspaceId),
                    isNull(projects.deletedAt),
                    sql`${projects.status} != 'completed'`
                )
            );

        // 2. Pending Scope Flags (Risk count)
        const [pendingFlags] = await db
            .select({ value: count() })
            .from(scopeFlags)
            .where(
                and(
                    eq(scopeFlags.workspaceId, workspaceId),
                    eq(scopeFlags.status, "pending")
                )
            );

        // 3. Average Brief Score (Clarity)
        const [avgScore] = await db
            .select({ value: avg(briefs.scopeScore) })
            .from(briefs)
            .where(
                and(
                    eq(briefs.workspaceId, workspaceId),
                    sql`${briefs.scopeScore} IS NOT NULL`
                )
            );

        // 4. Revenue at Risk (Sum of budgets for projects with pending flags)
        const riskResult = await db
            .select({ budget: projects.budget })
            .from(projects)
            .innerJoin(scopeFlags, eq(projects.id, scopeFlags.projectId))
            .where(
                and(
                    eq(projects.workspaceId, workspaceId),
                    eq(scopeFlags.status, "pending"),
                    isNull(projects.deletedAt)
                )
            )
            .groupBy(projects.id, projects.budget);

        const totalRisk = riskResult.reduce(
            (acc, curr) => acc + (Number(curr.budget) || 0),
            0
        );

        return {
            activeProjects: Number(activeProjects?.value) || 0,
            pendingFlags: Number(pendingFlags?.value) || 0,
            avgBriefScore: Math.round(Number(avgScore?.value)) || 0,
            revenueAtRisk: totalRisk,
        };
    },

    async getProjectHealth(workspaceId: string, projectId: string) {
        const [project] = await db
            .select({
                id: projects.id,
                name: projects.name,
                status: projects.status,
                budget: projects.budget,
                clientId: projects.clientId,
            })
            .from(projects)
            .where(
                and(
                    eq(projects.id, projectId),
                    eq(projects.workspaceId, workspaceId),
                    isNull(projects.deletedAt)
                )
            )
            .limit(1);

        if (!project) return null;

        // Scope flag counts
        const flagRows = await db
            .select({
                status: scopeFlags.status,
                cnt: count(),
            })
            .from(scopeFlags)
            .where(
                and(
                    eq(scopeFlags.projectId, projectId),
                    eq(scopeFlags.workspaceId, workspaceId)
                )
            )
            .groupBy(scopeFlags.status);

        const pendingFlagsCount = flagRows
            .filter((r) => r.status === "pending")
            .reduce((acc, r) => acc + Number(r.cnt), 0);

        const resolvedFlagsCount = flagRows
            .filter((r) => r.status === "resolved")
            .reduce((acc, r) => acc + Number(r.cnt), 0);

        // Change order counts — "open" = sent to client (awaiting response), "accepted" = accepted
        const coRows = await db
            .select({
                status: changeOrders.status,
                cnt: count(),
            })
            .from(changeOrders)
            .where(
                and(
                    eq(changeOrders.projectId, projectId),
                    eq(changeOrders.workspaceId, workspaceId)
                )
            )
            .groupBy(changeOrders.status);

        const openChangeOrders = coRows
            .filter((r) => r.status === "sent")
            .reduce((acc, r) => acc + Number(r.cnt), 0);

        const acceptedChangeOrders = coRows
            .filter((r) => r.status === "accepted")
            .reduce((acc, r) => acc + Number(r.cnt), 0);

        // Brief health
        const briefRows = await db
            .select({
                status: briefs.status,
                cnt: count(),
                avgScore: avg(briefs.scopeScore),
            })
            .from(briefs)
            .where(
                and(
                    eq(briefs.projectId, projectId),
                    eq(briefs.workspaceId, workspaceId),
                    isNull(briefs.deletedAt)
                )
            )
            .groupBy(briefs.status);

        const totalBriefs = briefRows.reduce(
            (acc, r) => acc + Number(r.cnt),
            0
        );

        // Compute weighted average score across all status groups
        const scoredRows = briefRows.filter(
            (r) => r.avgScore !== null && r.avgScore !== undefined
        );
        const weightedScoreSum = scoredRows.reduce(
            (acc, r) => acc + Number(r.avgScore) * Number(r.cnt),
            0
        );
        const scoredCount = scoredRows.reduce(
            (acc, r) => acc + Number(r.cnt),
            0
        );
        const avgBriefScore: number | null =
            scoredCount > 0 ? weightedScoreSum / scoredCount : null;

        // "flagged" = clarification_needed, "approved" = approved
        const flaggedBriefs = briefRows
            .filter((r) => r.status === "clarification_needed")
            .reduce((acc, r) => acc + Number(r.cnt), 0);

        const approvedBriefs = briefRows
            .filter((r) => r.status === "approved")
            .reduce((acc, r) => acc + Number(r.cnt), 0);

        // Deliverable health
        const deliverableRows = await db
            .select({
                status: deliverables.status,
                cnt: count(),
            })
            .from(deliverables)
            .where(
                and(
                    eq(deliverables.projectId, projectId),
                    eq(deliverables.workspaceId, workspaceId),
                    isNull(deliverables.deletedAt)
                )
            )
            .groupBy(deliverables.status);

        const totalDeliverables = deliverableRows.reduce(
            (acc, r) => acc + Number(r.cnt),
            0
        );

        const approvedDeliverables = deliverableRows
            .filter((r) => r.status === "approved")
            .reduce((acc, r) => acc + Number(r.cnt), 0);

        const inReviewDeliverables = deliverableRows
            .filter((r) => r.status === "in_review")
            .reduce((acc, r) => acc + Number(r.cnt), 0);

        const changesRequestedDeliverables = deliverableRows
            .filter((r) => r.status === "changes_requested")
            .reduce((acc, r) => acc + Number(r.cnt), 0);

        // Overall score: 100 - (pendingFlags * 15) - (changesRequested * 5), clamped [0, 100]
        const overallScore = Math.min(
            100,
            Math.max(
                0,
                100 -
                    pendingFlagsCount * 15 -
                    changesRequestedDeliverables * 5
            )
        );

        return {
            project: {
                id: project.id,
                name: project.name,
                status: project.status,
                budget: project.budget,
                clientId: project.clientId,
            },
            scopeHealth: {
                pendingFlags: pendingFlagsCount,
                resolvedFlags: resolvedFlagsCount,
                openChangeOrders,
                acceptedChangeOrders,
            },
            briefHealth: {
                totalBriefs,
                avgScore: avgBriefScore !== null ? Math.round(avgBriefScore) : null,
                flaggedCount: flaggedBriefs,
                approvedCount: approvedBriefs,
            },
            deliverableHealth: {
                total: totalDeliverables,
                approved: approvedDeliverables,
                inReview: inReviewDeliverables,
                changesRequested: changesRequestedDeliverables,
            },
            overallScore,
        };
    },

    async getWorkspaceTimeline(workspaceId: string) {
        // Returns weekly activity counts for the last 8 weeks.
        // DATE_TRUNC produces the Monday of each ISO week; we format it as YYYY-"W"WW.
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 7 * 8); // 8 weeks ago

        const [projectCounts, briefCounts, deliverableCounts, flagCounts] =
            await Promise.all([
                db
                    .select({
                        week: sql<string>`TO_CHAR(DATE_TRUNC('week', ${projects.createdAt}), 'IYYY-"W"IW')`,
                        cnt: count(),
                    })
                    .from(projects)
                    .where(
                        and(
                            eq(projects.workspaceId, workspaceId),
                            isNull(projects.deletedAt),
                            sql`${projects.createdAt} >= ${cutoff.toISOString()}`
                        )
                    )
                    .groupBy(
                        sql`DATE_TRUNC('week', ${projects.createdAt})`
                    )
                    .orderBy(sql`DATE_TRUNC('week', ${projects.createdAt})`),

                db
                    .select({
                        week: sql<string>`TO_CHAR(DATE_TRUNC('week', ${briefs.createdAt}), 'IYYY-"W"IW')`,
                        cnt: count(),
                    })
                    .from(briefs)
                    .where(
                        and(
                            eq(briefs.workspaceId, workspaceId),
                            isNull(briefs.deletedAt),
                            sql`${briefs.createdAt} >= ${cutoff.toISOString()}`
                        )
                    )
                    .groupBy(
                        sql`DATE_TRUNC('week', ${briefs.createdAt})`
                    )
                    .orderBy(sql`DATE_TRUNC('week', ${briefs.createdAt})`),

                db
                    .select({
                        week: sql<string>`TO_CHAR(DATE_TRUNC('week', ${deliverables.createdAt}), 'IYYY-"W"IW')`,
                        cnt: count(),
                    })
                    .from(deliverables)
                    .where(
                        and(
                            eq(deliverables.workspaceId, workspaceId),
                            isNull(deliverables.deletedAt),
                            sql`${deliverables.createdAt} >= ${cutoff.toISOString()}`
                        )
                    )
                    .groupBy(
                        sql`DATE_TRUNC('week', ${deliverables.createdAt})`
                    )
                    .orderBy(sql`DATE_TRUNC('week', ${deliverables.createdAt})`),

                db
                    .select({
                        week: sql<string>`TO_CHAR(DATE_TRUNC('week', ${scopeFlags.createdAt}), 'IYYY-"W"IW')`,
                        cnt: count(),
                    })
                    .from(scopeFlags)
                    .where(
                        and(
                            eq(scopeFlags.workspaceId, workspaceId),
                            sql`${scopeFlags.createdAt} >= ${cutoff.toISOString()}`
                        )
                    )
                    .groupBy(
                        sql`DATE_TRUNC('week', ${scopeFlags.createdAt})`
                    )
                    .orderBy(sql`DATE_TRUNC('week', ${scopeFlags.createdAt})`),
            ]);

        // Collect all week labels that appear across any entity
        const allWeeks = new Set<string>();
        for (const row of [...projectCounts, ...briefCounts, ...deliverableCounts, ...flagCounts]) {
            allWeeks.add(row.week);
        }

        // Build lookup maps
        const projectMap = new Map(projectCounts.map((r) => [r.week, Number(r.cnt)]));
        const briefMap = new Map(briefCounts.map((r) => [r.week, Number(r.cnt)]));
        const deliverableMap = new Map(deliverableCounts.map((r) => [r.week, Number(r.cnt)]));
        const flagMap = new Map(flagCounts.map((r) => [r.week, Number(r.cnt)]));

        // Sort weeks chronologically (ISO week strings sort lexicographically)
        const sortedWeeks = Array.from(allWeeks).sort();

        const weeks = sortedWeeks.map((week) => ({
            week,
            projects: projectMap.get(week) ?? 0,
            briefs: briefMap.get(week) ?? 0,
            deliverables: deliverableMap.get(week) ?? 0,
            flags: flagMap.get(week) ?? 0,
        }));

        return { weeks };
    },
};
