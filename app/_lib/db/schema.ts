import {
  pgTable,
  uuid,
  text,
  timestamp,
  varchar,
  jsonb,
  doublePrecision,
  pgEnum,
  index,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import type { Claim } from "@/app/api/v1/articles/_lib/types/claim";
import type { FramingDTO } from "@/app/api/v1/articles/_lib/dtos/framing";
import type { SummaryDTO } from "@/app/api/v1/articles/_lib/dtos/summary";
import type { ClaimVerificationDTO } from "@/app/api/v1/articles/_lib/dtos/claim-verification";
import type { MetaDTO } from "@/app/api/v1/articles/_lib/dtos/meta";

export const analysisTaskStatusEnum = pgEnum("analysis_task_status", [
  "pending",
  "running",
  "completed",
]);
export const analysisJobStatusEnum = pgEnum("analysis_job_status", [
  "queued",
  "running",
  "completed",
  "failed",
]);

export const sources = pgTable("sources", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  slug: text("slug").notNull(),
  bias: varchar("bias", { length: 50 }).notNull().default("center"),
  factualReporting: varchar("factual_reporting", { length: 50 }),
  country: varchar("country", { length: 100 }),
  mediaType: varchar("media_type", { length: 50 }),
  credibility: varchar("credibility", { length: 50 }),
});

export const articles = pgTable(
  "articles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sourceId: uuid("source_id")
      .notNull()
      .references(() => sources.id, { onDelete: "cascade" }),
    url: text("url").notNull().unique(),
    title: text("title").notNull(),
    language: text("language").notNull(),
    byline: text("byline").notNull(),
    excerpt: text("excerpt").notNull(),
    textContent: text("text_content").notNull(),
    keywords: text("keywords"),
    publishedTime: timestamp("published_time", { withTimezone: true })
      .notNull()
      .defaultNow(),
    thumbnailUrl: text("thumbnail_url"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("articles_title_content_search_idx").using(
      "gin",
      sql`(
        setweight(to_tsvector('english', ${table.title}), 'A') ||
        setweight(to_tsvector('english', ${table.textContent}), 'B')
      )`,
    ),
  ],
);

export const analyses = pgTable("analyses", {
  id: uuid("id").defaultRandom().primaryKey(),
  articleId: uuid("article_id")
    .notNull()
    .unique()
    .references(() => articles.id, { onDelete: "cascade" }),
  slug: text("slug").notNull().unique(),
  summary: jsonb("summary").$type<SummaryDTO | null>(),
  sentiment: text("sentiment"),
  framing: jsonb("framing").$type<FramingDTO | null>(),
  claims: jsonb("claims").$type<
    (Claim & { verification: ClaimVerificationDTO | null })[] | null
  >(),
  meta: jsonb("meta").$type<MetaDTO>().notNull(),
  factualScore: doublePrecision("factual_score"),
  biasScore: doublePrecision("bias_score"),
  summaryStatus: analysisTaskStatusEnum("summary_status")
    .notNull()
    .default("pending"),
  rhetoricalAnalysisStatus: analysisTaskStatusEnum("rhetorical_analysis_status")
    .notNull()
    .default("pending"),
  claimExtractionStatus: analysisTaskStatusEnum("claim_extraction_status")
    .notNull()
    .default("pending"),
  claimVerificationStatus: analysisTaskStatusEnum("claim_verification_status")
    .notNull()
    .default("pending"),
  factualScoreStatus: analysisTaskStatusEnum("factual_score_status")
    .notNull()
    .default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const analysisJobs = pgTable(
  "analysis_jobs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    guestIdHash: text("guest_id_hash"),
    articleUrl: text("article_url").notNull(),
    status: analysisJobStatusEnum("status").notNull().default("queued"),
    progress: doublePrecision("progress").notNull().default(0),
    message: text("message"),
    resultSlug: text("result_slug"),
    dismissedAt: timestamp("dismissed_at", { withTimezone: true }),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("analysis_jobs_user_status_idx").on(table.userId, table.status),
    index("analysis_jobs_guest_status_idx").on(table.guestIdHash, table.status),
  ],
);

export const usageEvents = pgTable(
  "usage_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    jobId: uuid("job_id")
      .notNull()
      .unique()
      .references(() => analysisJobs.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    guestIdHash: text("guest_id_hash"),
    action: text("action").notNull().default("analysis_accepted"),
    planAtAcceptance: text("plan_at_acceptance").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("usage_events_user_created_idx").on(table.userId, table.createdAt),
    index("usage_events_guest_created_idx").on(
      table.guestIdHash,
      table.createdAt,
    ),
  ],
);

export const rejectedSubmissions = pgTable("rejected_submissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  submittedUrl: text("submitted_url").notNull(),
  normalizedUrl: text("normalized_url").notNull(),
  finalUrl: text("final_url"),
  rejectionReason: text("rejection_reason").notNull(),
  detectionSignals: jsonb("detection_signals").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  role: text("role").default("user").notNull(),
  banned: boolean("banned").default(false).notNull(),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
  plan: text("plan").default("reader").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const analysisReports = pgTable(
  "analysis_reports",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    analysisId: uuid("analysis_id")
      .notNull()
      .references(() => analyses.id, { onDelete: "cascade" }),
    articleId: uuid("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    section: text("section").notNull(),
    itemIndex: integer("item_index"),
    reason: text("reason").notNull(),
    comment: text("comment"),
    snapshot: jsonb("snapshot").notNull(),
    status: text("status").notNull().default("new"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("analysis_reports_analysis_created_idx").on(
      table.analysisId,
      table.createdAt,
    ),
    index("analysis_reports_user_created_idx").on(table.userId, table.createdAt),
    index("analysis_reports_status_created_idx").on(table.status, table.createdAt),
  ],
);

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    impersonatedBy: text("impersonated_by"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));
