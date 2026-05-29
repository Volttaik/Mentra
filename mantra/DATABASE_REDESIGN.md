# MENTRA — DATABASE REDESIGN

**Date:** May 29, 2026  
**Purpose:** Comprehensive database architecture for production Mentra platform

---

## PART 1 — CURRENT SCHEMA AUDIT

### Existing Tables
| Table | Assessment | Issues |
|---|---|---|
| `users` | Good foundation | Missing: social links, expertise tags, ban status |
| `accounts` | Correct NextAuth structure | OK |
| `sessions` | Correct NextAuth structure | OK |
| `stacks` | Good core | Missing: price, license, archive status, fork_of reference |
| `editions` | Good concept | `editorId` not FK-linked to User properly |
| `mt_content` | Innovative | `stackId` redundant (already via edition) |
| `modules` | Minimal | Missing: actual file references |
| `tags` / `stack_tags` | Good | OK |
| `stack_stars` | Correct | OK |
| `stack_forks` | Incomplete | Doesn't link to a forked stack entity |
| `bookmarks` | Correct | OK |
| `contributions` | Stub | Missing: diff content, target edition |
| `discussions` | OK | Missing: parent_id for nesting |
| `comments` | OK | Missing: parent_id for threading |
| `follows` | Correct | OK |
| `notifications` | Good | Missing: actor reference |
| `api_keys` | Good | Keys stored in plaintext — SECURITY ISSUE |
| `learning_progress` | Exists | No API or UI |

### Missing Tables (Critical)
- `files` — actual uploaded file records
- `purchases` — paid stack purchases
- `subscriptions` — creator subscriptions
- `organizations` — team/institutional accounts
- `reports` — content moderation
- `audit_logs` — admin audit trail
- `user_achievements` — badges/achievements
- `reading_lists` — curated playlists
- `annotations` — in-document highlights/notes

---

## PART 2 — REDESIGNED SCHEMA

### Core Changes From Existing
1. `Stack` gets `price`, `priceType`, `license`, `isArchived`, `forkedFromId`, `coverImage`
2. `User` gets `bannedAt`, `website`, `twitter`, `linkedin`, `orcid`, `expertiseTags`
3. `Module` gets a proper `files` relation to a new `File` table
4. `StackFork` links to a new forked `Stack` entity
5. `Comment` gets `parentId` for threading
6. `ApiKey` gets hashed key storage
7. New tables: `File`, `Purchase`, `Subscription`, `Organization`, `OrganizationMember`, `Report`, `AuditLog`, `UserAchievement`, `ReadingList`, `ReadingListItem`, `Annotation`

---

## PART 3 — COMPLETE FUTURE-PROOF SCHEMA

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─────────────────────────────────────────────
// USERS & IDENTITY
// ─────────────────────────────────────────────

model User {
  id              String    @id @default(cuid())
  name            String
  username        String    @unique
  email           String    @unique
  emailVerified   DateTime?
  image           String?
  banner          String?
  password        String?
  bio             String?
  university      String?
  department      String?
  level           String?
  website         String?
  twitter         String?
  linkedin        String?
  orcid           String?
  location        String?
  expertiseTags   String[]  @default([])
  isVerified      Boolean   @default(false)
  role            Role      @default(STUDENT)
  bannedAt        DateTime?
  banReason       String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  stacks          Stack[]          @relation("StackOwner")
  contributions   Contribution[]
  stars           StackStar[]
  forks           StackFork[]
  bookmarks       Bookmark[]
  sessions        Session[]
  accounts        Account[]
  discussions     Discussion[]
  comments        Comment[]
  followers       Follow[]         @relation("Following")
  following       Follow[]         @relation("Follower")
  notifications   Notification[]
  apiKeys         ApiKey[]
  progress        LearningProgress[]
  achievements    UserAchievement[]
  purchases       Purchase[]
  subscriptionsTo Subscription[]   @relation("SubscriberUser")
  readingLists    ReadingList[]
  annotations     Annotation[]
  orgMemberships  OrganizationMember[]
  reports         Report[]         @relation("Reporter")
  auditLogs       AuditLog[]

  @@map("users")
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

// ─────────────────────────────────────────────
// ORGANIZATIONS
// ─────────────────────────────────────────────

model Organization {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  description String?
  image       String?
  website     String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  members     OrganizationMember[]
  stacks      Stack[]

  @@map("organizations")
}

model OrganizationMember {
  userId   String
  orgId    String
  role     OrgRole  @default(MEMBER)
  joinedAt DateTime @default(now())
  user     User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  org      Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)

  @@id([userId, orgId])
  @@map("organization_members")
}

// ─────────────────────────────────────────────
// STACKS
// ─────────────────────────────────────────────

model Stack {
  id            String    @id @default(cuid())
  title         String
  slug          String    @unique
  description   String
  readme        String?
  courseCode    String?
  university    String?
  department    String?
  semester      String?
  language      String    @default("PDF")
  license       String?
  coverImage    String?
  isPublic      StackVisibility @default(PUBLIC)
  isVerified    Boolean   @default(false)
  isArchived    Boolean   @default(false)
  views         Int       @default(0)
  priceType     PriceType @default(FREE)
  price         Decimal?  @db.Decimal(10, 2)
  currency      String    @default("USD")
  ownerId       String
  orgId         String?
  forkedFromId  String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  owner         User             @relation("StackOwner", fields: [ownerId], references: [id])
  org           Organization?    @relation(fields: [orgId], references: [id])
  forkedFrom    Stack?           @relation("StackForks", fields: [forkedFromId], references: [id])
  forkChildren  Stack[]          @relation("StackForks")
  tags          StackTag[]
  modules       Module[]
  editions      Edition[]
  stars         StackStar[]
  forks         StackFork[]
  bookmarks     Bookmark[]
  discussions   Discussion[]
  contributions Contribution[]
  progress      LearningProgress[]
  purchases     Purchase[]
  reports       Report[]

  @@index([ownerId])
  @@index([department])
  @@index([university])
  @@index([isPublic, isArchived])
  @@map("stacks")
}

model Edition {
  id          String   @id @default(cuid())
  stackId     String
  version     String
  changelog   String?
  snapshot    Json
  editorId    String
  createdAt   DateTime @default(now())

  stack       Stack       @relation(fields: [stackId], references: [id], onDelete: Cascade)
  editor      User        @relation(fields: [editorId], references: [id])  // NOTE: add this relation to User
  mtContent   MtContent[]

  @@index([stackId])
  @@map("editions")
}

model MtContent {
  id           String   @id @default(cuid())
  editionId    String
  stackId      String
  rawContent   String
  sections     Json
  concepts     Json
  summary      String?
  references   Json
  searchIndex  String
  fileName     String?
  fileType     String?
  fileId       String?
  createdAt    DateTime @default(now())

  edition      Edition  @relation(fields: [editionId], references: [id], onDelete: Cascade)
  file         File?    @relation(fields: [fileId], references: [id])

  @@index([stackId])
  @@map("mt_content")
}

// ─────────────────────────────────────────────
// FILES
// ─────────────────────────────────────────────

model File {
  id           String   @id @default(cuid())
  stackId      String
  moduleId     String?
  uploaderId   String
  name         String
  originalName String
  mimeType     String
  size         Int
  storageKey   String   @unique
  storageUrl   String
  isPublic     Boolean  @default(true)
  order        Int      @default(0)
  createdAt    DateTime @default(now())

  stack        Stack     @relation(fields: [stackId], references: [id], onDelete: Cascade)  // add to Stack
  module       Module?   @relation(fields: [moduleId], references: [id])
  mtContents   MtContent[]
  annotations  Annotation[]

  @@index([stackId])
  @@index([moduleId])
  @@map("files")
}

model Module {
  id       String  @id @default(cuid())
  title    String
  type     String  @default("lecture")
  duration String?
  order    Int     @default(0)
  stackId  String
  stack    Stack   @relation(fields: [stackId], references: [id], onDelete: Cascade)
  files    File[]

  @@index([stackId])
  @@map("modules")
}

// ─────────────────────────────────────────────
// TAGS
// ─────────────────────────────────────────────

model Tag {
  id     String     @id @default(cuid())
  name   String     @unique
  stacks StackTag[]

  @@map("tags")
}

model StackTag {
  stackId String
  tagId   String
  stack   Stack  @relation(fields: [stackId], references: [id], onDelete: Cascade)
  tag     Tag    @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([stackId, tagId])
  @@map("stack_tags")
}

// ─────────────────────────────────────────────
// SOCIAL
// ─────────────────────────────────────────────

model StackStar {
  userId    String
  stackId   String
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  stack     Stack    @relation(fields: [stackId], references: [id], onDelete: Cascade)

  @@id([userId, stackId])
  @@map("stack_stars")
}

model StackFork {
  id             String   @id @default(cuid())
  userId         String
  sourceStackId  String
  forkedStackId  String?
  createdAt      DateTime @default(now())
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  sourceStack    Stack    @relation(fields: [sourceStackId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([sourceStackId])
  @@map("stack_forks")
}

model Bookmark {
  userId    String
  stackId   String
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  stack     Stack    @relation(fields: [stackId], references: [id], onDelete: Cascade)

  @@id([userId, stackId])
  @@map("bookmarks")
}

model Follow {
  followerId  String
  followingId String
  createdAt   DateTime @default(now())
  follower    User     @relation("Follower",  fields: [followerId],  references: [id], onDelete: Cascade)
  following   User     @relation("Following", fields: [followingId], references: [id], onDelete: Cascade)

  @@id([followerId, followingId])
  @@map("follows")
}

// ─────────────────────────────────────────────
// DISCUSSIONS & COMMENTS
// ─────────────────────────────────────────────

model Discussion {
  id         String    @id @default(cuid())
  title      String
  body       String
  userId     String
  stackId    String
  resolved   Boolean   @default(false)
  isPinned   Boolean   @default(false)
  type       String    @default("discussion")
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt
  user       User      @relation(fields: [userId], references: [id])
  stack      Stack     @relation(fields: [stackId], references: [id])
  comments   Comment[]

  @@index([stackId])
  @@map("discussions")
}

model Comment {
  id           String     @id @default(cuid())
  body         String
  userId       String
  discussionId String
  parentId     String?
  isAccepted   Boolean    @default(false)
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
  user         User       @relation(fields: [userId], references: [id])
  discussion   Discussion @relation(fields: [discussionId], references: [id], onDelete: Cascade)
  parent       Comment?   @relation("CommentReplies", fields: [parentId], references: [id])
  replies      Comment[]  @relation("CommentReplies")

  @@index([discussionId])
  @@map("comments")
}

// ─────────────────────────────────────────────
// CONTRIBUTIONS
// ─────────────────────────────────────────────

model Contribution {
  id          String             @id @default(cuid())
  userId      String
  stackId     String
  editionId   String?
  message     String
  diff        Json?
  status      ContributionStatus @default(PENDING)
  reviewerId  String?
  reviewedAt  DateTime?
  createdAt   DateTime           @default(now())
  user        User               @relation(fields: [userId], references: [id])
  stack       Stack              @relation(fields: [stackId], references: [id])

  @@index([stackId])
  @@map("contributions")
}

// ─────────────────────────────────────────────
// MONETIZATION
// ─────────────────────────────────────────────

model Purchase {
  id              String        @id @default(cuid())
  userId          String
  stackId         String
  amount          Decimal       @db.Decimal(10, 2)
  currency        String        @default("USD")
  status          PaymentStatus @default(PENDING)
  stripePaymentId String?       @unique
  createdAt       DateTime      @default(now())
  user            User          @relation(fields: [userId], references: [id])
  stack           Stack         @relation(fields: [stackId], references: [id])

  @@index([userId])
  @@index([stackId])
  @@map("purchases")
}

model Subscription {
  id              String             @id @default(cuid())
  subscriberId    String
  creatorId       String
  stripeSubId     String?            @unique
  status          SubscriptionStatus @default(ACTIVE)
  amount          Decimal            @db.Decimal(10, 2)
  currency        String             @default("USD")
  currentPeriodEnd DateTime?
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt
  subscriber      User               @relation("SubscriberUser", fields: [subscriberId], references: [id])

  @@index([subscriberId])
  @@index([creatorId])
  @@map("subscriptions")
}

// ─────────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────────

model Notification {
  id        String           @id @default(cuid())
  userId    String
  actorId   String?
  type      NotificationType
  title     String
  body      String
  read      Boolean          @default(false)
  link      String?
  createdAt DateTime         @default(now())
  user      User             @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, read])
  @@map("notifications")
}

// ─────────────────────────────────────────────
// API KEYS
// ─────────────────────────────────────────────

model ApiKey {
  id          String    @id @default(cuid())
  userId      String
  name        String
  keyHash     String    @unique
  keyPrefix   String
  lastUsed    DateTime?
  requests    Int       @default(0)
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("api_keys")
}

// ─────────────────────────────────────────────
// LEARNING
// ─────────────────────────────────────────────

model LearningProgress {
  id        String   @id @default(cuid())
  userId    String
  stackId   String
  moduleId  String?
  position  Int      @default(0)
  completed Boolean  @default(false)
  updatedAt DateTime @updatedAt
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  stack     Stack    @relation(fields: [stackId], references: [id], onDelete: Cascade)

  @@unique([userId, stackId])
  @@map("learning_progress")
}

model ReadingList {
  id          String            @id @default(cuid())
  userId      String
  title       String
  description String?
  isPublic    Boolean           @default(false)
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt
  user        User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  items       ReadingListItem[]

  @@map("reading_lists")
}

model ReadingListItem {
  id            String      @id @default(cuid())
  readingListId String
  stackId       String
  order         Int         @default(0)
  addedAt       DateTime    @default(now())
  list          ReadingList @relation(fields: [readingListId], references: [id], onDelete: Cascade)

  @@unique([readingListId, stackId])
  @@map("reading_list_items")
}

model Annotation {
  id        String   @id @default(cuid())
  userId    String
  fileId    String
  body      String
  color     String   @default("yellow")
  page      Int?
  x         Float?
  y         Float?
  width     Float?
  height    Float?
  isPrivate Boolean  @default(true)
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  file      File     @relation(fields: [fileId], references: [id], onDelete: Cascade)

  @@index([fileId])
  @@map("annotations")
}

// ─────────────────────────────────────────────
// ACHIEVEMENTS
// ─────────────────────────────────────────────

model Achievement {
  id          String            @id @default(cuid())
  key         String            @unique
  title       String
  description String
  icon        String?
  users       UserAchievement[]

  @@map("achievements")
}

model UserAchievement {
  userId        String
  achievementId String
  earnedAt      DateTime    @default(now())
  user          User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  achievement   Achievement @relation(fields: [achievementId], references: [id])

  @@id([userId, achievementId])
  @@map("user_achievements")
}

// ─────────────────────────────────────────────
// MODERATION
// ─────────────────────────────────────────────

model Report {
  id           String       @id @default(cuid())
  reporterId   String
  type         ReportType
  targetStackId String?
  targetUserId  String?
  reason       String
  details      String?
  status       ReportStatus @default(PENDING)
  resolvedById String?
  resolvedAt   DateTime?
  createdAt    DateTime     @default(now())
  reporter     User         @relation("Reporter", fields: [reporterId], references: [id])
  targetStack  Stack?       @relation(fields: [targetStackId], references: [id])

  @@index([status])
  @@map("reports")
}

model AuditLog {
  id        String   @id @default(cuid())
  userId    String
  action    String
  target    String?
  targetId  String?
  metadata  Json?
  ip        String?
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([createdAt])
  @@map("audit_logs")
}

// ─────────────────────────────────────────────
// ENUMERATIONS
// ─────────────────────────────────────────────

enum Role {
  STUDENT
  PROFESSOR
  ADMIN
}

enum OrgRole {
  OWNER
  ADMIN
  MEMBER
}

enum StackVisibility {
  PUBLIC
  PRIVATE
  INSTITUTION_ONLY
}

enum PriceType {
  FREE
  ONE_TIME
  SUBSCRIPTION
}

enum PaymentStatus {
  PENDING
  COMPLETED
  FAILED
  REFUNDED
}

enum SubscriptionStatus {
  ACTIVE
  PAUSED
  CANCELLED
  EXPIRED
}

enum ContributionStatus {
  PENDING
  APPROVED
  REJECTED
}

enum NotificationType {
  STAR
  FORK
  CONTRIBUTION
  COMMENT
  FOLLOW
  MENTION
  PURCHASE
  SYSTEM
}

enum ReportType {
  STACK
  USER
  COMMENT
  DISCUSSION
}

enum ReportStatus {
  PENDING
  REVIEWING
  RESOLVED
  DISMISSED
}
```

---

## PART 4 — KEY INDEXES FOR PERFORMANCE

```sql
-- Full-text search on stacks (PostgreSQL tsvector)
ALTER TABLE stacks ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english',
      coalesce(title, '') || ' ' ||
      coalesce(description, '') || ' ' ||
      coalesce(course_code, '') || ' ' ||
      coalesce(university, '') || ' ' ||
      coalesce(department, '')
    )
  ) STORED;

CREATE INDEX stacks_search_idx ON stacks USING GIN(search_vector);

-- Trigram index for partial matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX stacks_title_trgm ON stacks USING GIN(title gin_trgm_ops);

-- Trending stacks (composite)
CREATE INDEX stacks_trending ON stacks(is_public, is_archived, updated_at DESC, views DESC);

-- User lookup
CREATE INDEX users_email_idx ON users(email);
CREATE INDEX users_username_idx ON users(username);

-- Notifications (unread query optimization)
CREATE INDEX notifs_user_unread ON notifications(user_id, read, created_at DESC);
```

---

## PART 5 — ENTITY RELATIONSHIP SUMMARY

```
User ──< Stack (owner)
User ──< StackStar
User ──< StackFork
User ──< Bookmark
User ──< Follow (follower / following)
User ──< Contribution
User ──< Discussion
User ──< Comment
User ──< Notification
User ──< ApiKey
User ──< LearningProgress
User ──< Purchase
User ──< Subscription (as subscriber)
User ──< ReadingList
User ──< Annotation
User ──< Report (as reporter)
User ──< UserAchievement
User >─< Organization (via OrganizationMember)

Stack ──< Edition
Stack ──< Module ──< File
Stack ──< MtContent (via Edition)
Stack ──< StackStar
Stack ──< StackFork
Stack ──< Bookmark
Stack ──< Discussion ──< Comment
Stack ──< Contribution
Stack ──< LearningProgress
Stack ──< Purchase
Stack ──< Report
Stack >─< Tag (via StackTag)
Stack ──< Stack (self via forkedFrom)

Edition ──< MtContent
File ──< Annotation
Achievement ──< UserAchievement
ReadingList ──< ReadingListItem
```

---

## PART 6 — MIGRATION STRATEGY

### Phase 1 (Now) — Add without breaking
1. Add `license`, `coverImage`, `isArchived`, `priceType`, `price`, `currency` to `Stack`
2. Add `forkedFromId` to `Stack` (nullable)
3. Add `orgId` to `Stack` (nullable)
4. Add `twitter`, `linkedin`, `orcid`, `expertiseTags`, `bannedAt`, `banReason` to `User`
5. Create `File` table + `moduleId` FK from File → Module
6. Replace `ApiKey.key` with `keyHash` + `keyPrefix` (migrate existing keys)
7. Add `actorId` to `Notification`
8. Add `parentId` to `Comment`

### Phase 2 (After file storage is set up)
1. Create `Organization` + `OrganizationMember`
2. Create `Purchase` + `Subscription`
3. Create `Report` + `AuditLog`

### Phase 3 (Education features)
1. Create `ReadingList` + `ReadingListItem`
2. Create `Annotation`
3. Create `Achievement` + `UserAchievement`

### Phase 4 (Full-text search)
1. Add `search_vector` computed column
2. Install `pg_trgm` extension
3. Add GIN indexes
