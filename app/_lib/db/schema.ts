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
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

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
