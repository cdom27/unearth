import { neonSql } from "@/app/_lib/db/client";
import { analyzeArticle } from "./service";

export type QueueOwner = { userId: string | null; guestIdHash: string | null };

export async function admitAnalysis(
  owner: QueueOwner,
  plan: string,
  role: string,
  articleUrl: string,
) {
  const admin = role === "admin";
  const concurrency = admin ? null : owner.userId ? 2 : 1;
  const queueLimit = admin ? null : owner.userId ? 3 : 0;
  const dailyLimit = admin ? null : owner.userId ? 12 : 5;
  const key = owner.userId
    ? `user:${owner.userId}`
    : `guest:${owner.guestIdHash}`;

  const rows = await neonSql`
    WITH owner_lock AS MATERIALIZED (
      SELECT pg_advisory_xact_lock(hashtext(${key}))
    ), usage AS MATERIALIZED (
      SELECT count(*)::int AS count FROM usage_events, owner_lock
      WHERE created_at >= (date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC')
        AND ((${owner.userId}::text IS NOT NULL AND user_id = ${owner.userId})
          OR (${owner.userId}::text IS NULL AND guest_id_hash = ${owner.guestIdHash}))
    ), active AS MATERIALIZED (
      SELECT count(*)::int AS count FROM analysis_jobs, owner_lock
      WHERE status = 'running' AND dismissed_at IS NULL
        AND ((${owner.userId}::text IS NOT NULL AND user_id = ${owner.userId})
          OR (${owner.userId}::text IS NULL AND guest_id_hash = ${owner.guestIdHash}))
    ), waiting AS MATERIALIZED (
      SELECT count(*)::int AS count FROM analysis_jobs, owner_lock
      WHERE status = 'queued' AND dismissed_at IS NULL
        AND ((${owner.userId}::text IS NOT NULL AND user_id = ${owner.userId})
          OR (${owner.userId}::text IS NULL AND guest_id_hash = ${owner.guestIdHash}))
    ), duplicate AS MATERIALIZED (
      SELECT id, status FROM analysis_jobs, owner_lock
      WHERE article_url = ${articleUrl} AND status IN ('queued', 'running')
        AND dismissed_at IS NULL
        AND ((${owner.userId}::text IS NOT NULL AND user_id = ${owner.userId})
          OR (${owner.userId}::text IS NULL AND guest_id_hash = ${owner.guestIdHash}))
      ORDER BY created_at DESC LIMIT 1
    ), decision AS MATERIALIZED (
      SELECT usage.count AS used, active.count AS active_count, waiting.count AS waiting_count,
        CASE
          WHEN duplicate.id IS NOT NULL THEN 'duplicate'
          WHEN ${dailyLimit}::int IS NOT NULL AND usage.count >= ${dailyLimit} THEN 'daily_limit'
          WHEN ${concurrency}::int IS NOT NULL
            AND active.count + waiting.count >= ${concurrency}::int + ${queueLimit}::int THEN 'queue_full'
          ELSE 'accepted'
        END AS result
      FROM usage, active, waiting, owner_lock LEFT JOIN duplicate ON true
    ), inserted AS (
      INSERT INTO analysis_jobs (user_id, guest_id_hash, article_url, status)
      SELECT ${owner.userId}, ${owner.guestIdHash}, ${articleUrl},
        CASE WHEN decision.active_count < COALESCE(${concurrency}, 2147483647) THEN 'queued' ELSE 'queued' END::analysis_job_status
      FROM decision WHERE result = 'accepted'
      RETURNING id, status
    ), recorded AS (
      INSERT INTO usage_events (job_id, user_id, guest_id_hash, plan_at_acceptance)
      SELECT inserted.id, ${owner.userId}, ${owner.guestIdHash}, ${admin ? "admin" : plan}
      FROM inserted RETURNING job_id
    )
    SELECT decision.result, decision.used, decision.active_count, decision.waiting_count,
      COALESCE(inserted.id, duplicate.id) AS "jobId",
      COALESCE(inserted.status, duplicate.status) AS status
    FROM decision LEFT JOIN inserted ON true LEFT JOIN duplicate ON true
  `;

  return rows[0] as {
    result: "accepted" | "duplicate" | "daily_limit" | "queue_full";
    used: number;
    active_count: number;
    waiting_count: number;
    jobId: string | null;
    status: string | null;
  };
}

export async function processOwnerQueue(owner: QueueOwner, role: string) {
  const key = owner.userId
    ? `user:${owner.userId}`
    : `guest:${owner.guestIdHash}`;
  const concurrency = role === "admin" ? null : owner.userId ? 2 : 1;

  while (true) {
    const claimed = await neonSql`
      WITH owner_lock AS MATERIALIZED (
        SELECT pg_advisory_xact_lock(hashtext(${key}))
      ), active AS MATERIALIZED (
        SELECT count(*)::int AS count FROM analysis_jobs, owner_lock
        WHERE status = 'running' AND dismissed_at IS NULL
          AND ((${owner.userId}::text IS NOT NULL AND user_id = ${owner.userId})
            OR (${owner.userId}::text IS NULL AND guest_id_hash = ${owner.guestIdHash}))
      ), candidate AS MATERIALIZED (
        SELECT id FROM analysis_jobs, active, owner_lock
        WHERE status = 'queued' AND dismissed_at IS NULL
          AND ((${owner.userId}::text IS NOT NULL AND user_id = ${owner.userId})
            OR (${owner.userId}::text IS NULL AND guest_id_hash = ${owner.guestIdHash}))
          AND (${concurrency}::int IS NULL OR active.count < ${concurrency})
        ORDER BY created_at, id LIMIT 1 FOR UPDATE SKIP LOCKED
      )
      UPDATE analysis_jobs SET status = 'running', progress = 5,
        started_at = now(), updated_at = now(), message = 'Preparing article'
      WHERE id = (SELECT id FROM candidate)
      RETURNING id, article_url AS "articleUrl"
    `;
    if (!claimed[0]) return;

    const job = claimed[0] as { id: string; articleUrl: string };
    try {
      await neonSql`UPDATE analysis_jobs SET progress = 15, message = 'Analyzing article', updated_at = now() WHERE id = ${job.id}`;
      const result = await analyzeArticle(job.articleUrl);
      if (!result.success) {
        await neonSql`UPDATE analysis_jobs SET status = 'failed', progress = 100, message = ${result.error}, completed_at = now(), updated_at = now() WHERE id = ${job.id}`;
      } else {
        await neonSql`UPDATE analysis_jobs SET status = 'completed', progress = 100, message = 'Analysis complete', result_slug = ${result.slug}, completed_at = now(), updated_at = now() WHERE id = ${job.id}`;
      }
    } catch (error) {
      console.error("Analysis queue job failed:", job.id, error);
      await neonSql`UPDATE analysis_jobs SET status = 'failed', progress = 100, message = 'Unable to complete article analysis', completed_at = now(), updated_at = now() WHERE id = ${job.id}`;
    }
  }
}

export async function getOwnerQueue(owner: QueueOwner) {
  return neonSql`
    SELECT analysis_jobs.id, article_url AS "articleUrl", analysis_jobs.status,
      message, result_slug AS "resultSlug", analysis_jobs.created_at AS "createdAt",
      started_at AS "startedAt", completed_at AS "completedAt",
      CASE WHEN analysis_jobs.status = 'running' AND analyses.id IS NOT NULL THEN
        15 + (
          (CASE WHEN summary_status = 'completed' THEN 1 ELSE 0 END +
           CASE WHEN rhetorical_analysis_status = 'completed' THEN 1 ELSE 0 END +
           CASE WHEN claim_extraction_status = 'completed' THEN 1 ELSE 0 END +
           CASE WHEN claim_verification_status = 'completed' THEN 1 ELSE 0 END +
           CASE WHEN factual_score_status = 'completed' THEN 1 ELSE 0 END)::float / 5 * 80
        )
      ELSE analysis_jobs.progress END AS progress
    FROM analysis_jobs
    LEFT JOIN articles ON articles.url = analysis_jobs.article_url
    LEFT JOIN analyses ON analyses.article_id = articles.id
    WHERE ((${owner.userId}::text IS NOT NULL AND analysis_jobs.user_id = ${owner.userId})
      OR (${owner.userId}::text IS NULL AND analysis_jobs.guest_id_hash = ${owner.guestIdHash}))
      AND dismissed_at IS NULL
      AND analysis_jobs.created_at > now() - interval '7 days'
    ORDER BY analysis_jobs.created_at DESC LIMIT 30
  `;
}

export async function dismissAnalysisJob(owner: QueueOwner, jobId: string) {
  const rows = await neonSql`
    UPDATE analysis_jobs
    SET dismissed_at = now(), updated_at = now()
    WHERE id = ${jobId}::uuid
      AND status IN ('queued', 'completed', 'failed')
      AND dismissed_at IS NULL
      AND ((${owner.userId}::text IS NOT NULL AND user_id = ${owner.userId})
        OR (${owner.userId}::text IS NULL AND guest_id_hash = ${owner.guestIdHash}))
    RETURNING id
  `;
  return rows.length > 0;
}
