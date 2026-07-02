# Product Roadmap — From MVP to Social Platform

> Goal: evolve the current posts + reactions + follow-graph MVP into a
> high-end social app in the spirit of Facebook, Instagram, and LinkedIn.
> Scope: **learning / experiment** — prioritize a few marquee features built
> cleanly and idiomatically over production hardening and breadth.
>
> **UI / design direction:** the interface draws from three sources —
> Instagram's media-forward, immersive full-bleed visuals; Facebook's dense,
> multi-surface layout (tabs, cards, rich interactions); and LinkedIn's clean,
> professional, whitespace-generous card system and readable typography. The
> blend: **media-rich but calm and legible** — Instagram polish on the media,
> LinkedIn restraint on the chrome, Facebook breadth in the feature surface.

---

## 1. Where we are today (MVP baseline)

**Backend** — NestJS · GraphQL (code-first) · MongoDB (Mongoose) · Redis · Pusher/Apinator · Cloudinary

| Module          | What it does                                                          |
| -----------------| -----------------------------------------------------------------------|
| `auth`          | JWT access + refresh tokens, GQL auth guard, `@CurrentUser` decorator |
| `users`         | Profile (username, displayName, bio, avatar, cover, `isPrivate`)      |
| `posts`         | Media URLs, 6 reaction types, reaction breakdown, comment count       |
| `comments`      | Comments + replies                                                    |
| `follows`       | Directed follow graph, unique `(followerId, followingId)` index       |
| `feed`          | Home feed (Redis-cached first page, cursor pagination) + Explore feed |
| `notifications` | REACTION / COMMENT / REPLY / FOLLOW, read flag                        |
| `realtime`      | Pusher `trigger(channel, event, data)` wrapper                        |
| `upload`        | Cloudinary media upload                                               |

**Frontend** — Expo (SDK 57) · React Native · Apollo Client v4 · Pusher client

Screens: Splash, Login, Register, Feed, Explore, CreatePost, PostDetail,
Comments, Profile, Notifications. Auth + RealTime React contexts.

### Known gaps that affect what comes next
- **Realtime has no channel authorization.** The Pusher client subscribes to
  channels with no auth endpoint, so today only *public* channels work. Private
  1-to-1 features (DMs) need a private/presence channel auth route on the
  backend. **This is the first thing Phase 1 must add.**
- **No push notifications** — realtime only works while the app is foregrounded.
- Feed is reverse-chronological only (no ranking, hashtags, mentions, or shares).
- No search, no media beyond images, no ephemeral content.

---

## 2. Guiding principles for this phase

Because the goal is **learning**, every feature should:
1. **Reuse existing patterns** — code-first GraphQL resolvers, Mongoose schemas
   with `@ObjectType`, cursor pagination (`_id < cursor`, `sort({_id:-1})`),
   Redis for hot reads, Pusher for realtime, Cloudinary for media.
2. **Ship one vertical slice at a time** — schema → service → resolver →
   GraphQL query/mutation → screen → realtime wiring — before moving on.
3. **Stay honest about scope** — flag anything skipped (e.g. "no E2E encryption
   yet", "no media in messages yet") rather than pretending it's complete.

---

## 3. Roadmap at a glance

| Phase | Theme | Marquee outcome | Rough size |
|---|---|---|---|
| **0** | **Design-system foundation** ⭐ | Shared tokens (color, type, spacing, radius, elevation) + base UI components | Small–Medium |
| **1** | **Direct Messaging** ⭐ | Realtime 1:1 + group chat | Large |
| 2 | Feed richness | Hashtags, mentions, saves, shares, bookmarks | Medium |
| 3 | Professional networking (LinkedIn) | Rich profiles (headline/experience/skills), connections, articles | Medium–Large |
| 4 | Stories | Ephemeral 24h photo/video stories | Medium |
| 5 | Reels / short video | Vertical video feed + player | Large |
| 6 | Discovery & search | User/post/hashtag search, ranked Explore | Medium |
| 7 | Push notifications | Expo push for messages + social events | Medium |
| 8 | Groups / Pages / Events | Facebook-style communities | Large |
| 9 | Cross-cutting polish | Moderation, blocking, settings, media pipeline | Ongoing |

Phases 0 and 1 are fully designed below; Phases 2–9 are scoped enough to sequence
and estimate, and will be expanded into their own detailed specs when we reach them.

Ordering note: **Phase 0 comes first** so every screen built afterward pulls from
one design language — keeping the Instagram/Facebook/LinkedIn blend coherent
rather than drifting screen-to-screen.

---

## 4. Phase 0 — Design-system foundation ⭐

Built first so the Instagram/Facebook/LinkedIn blend stays coherent across every
new surface. Frontend-only; no backend changes.

### 4.0.1 Design tokens (`frontend/src/theme`)
Extend today's single `colors.ts` into a small token set:
- **color** — semantic roles (background, surface, surface-elevated, border,
  text-primary/secondary/muted, accent, danger, reaction colors) with light +
  dark values. LinkedIn-calm neutrals, one confident accent.
- **typography** — a type scale (display / title / body / caption) with weights;
  readable line-heights (LinkedIn legibility).
- **spacing** — a 4/8-based scale; generous whitespace defaults.
- **radius** & **elevation** — card corner radii + shadow levels (Instagram-soft
  cards, LinkedIn restraint on chrome).

### 4.0.2 Base UI components (`frontend/src/components/ui`)
A handful of primitives every future screen reuses, all consuming tokens:
`Text`, `Button`, `Card`, `Avatar`, `Input`, `IconButton`, `Divider`,
`Badge`, `ListItem`, `Skeleton`. Keeps chat, stories, profiles, etc. visually
consistent for free.

### 4.0.3 Theming plumbing
Light/dark support via a `ThemeProvider` + `useTheme()` hook (or reuse the
existing context pattern). Components read tokens from context, never hardcode.

### 4.0.4 Migration (light touch)
Refactor 1–2 existing screens (e.g. Feed card, Profile header) onto the new
tokens/components as the reference implementation — not a big-bang rewrite.
Remaining screens migrate opportunistically as we touch them.

---

## 5. Phase 1 — Direct Messaging (detailed) ⭐

The flagship next feature. Delivered as several vertical slices.

### 5.0 Prerequisite — private realtime channels
DMs must not leak to other users, so we need authorized channels before any
message flows.

- **Backend**: add a `POST /pusher/auth` (or GraphQL mutation) endpoint that
  validates the JWT, then calls `pusher.authorizeChannel(socketId, channel)`
  for `private-*` / `presence-*` channels the user is a member of.
- **Frontend**: extend `RealTimeContext` to pass `channelAuthorization` (auth
  endpoint + bearer token) to the Pusher constructor.
- Channel naming: `private-conversation-<conversationId>`, and a per-user
  `private-user-<userId>` channel for "new conversation" / unread-badge events.

### 5.1 Data model (new module: `messaging`)

```
Conversation
  _id
  participantIds: ObjectId[]        // 2 for DM, N for group
  isGroup: boolean
  name?: string                     // group title
  avatarUrl?: string                // group avatar
  lastMessage?: { text, senderId, createdAt }   // denormalized preview
  createdAt, updatedAt
  index: { participantIds: 1, updatedAt: -1 }

Message
  _id
  conversationId: ObjectId (index)
  senderId: ObjectId (ref User)
  text?: string
  mediaUrls: string[]               // reuse Cloudinary upload
  readBy: ObjectId[]                // read receipts
  createdAt
  index: { conversationId: 1, _id: -1 }   // cursor pagination

ConversationMember (optional, for groups)
  conversationId, userId, role, lastReadMessageId, mutedUntil
```

Denormalizing `lastMessage` onto `Conversation` keeps the inbox list a single
fast query (mirrors how `reactionCount`/`commentCount` are denormalized on Post).

### 5.2 GraphQL API

Queries
- `conversations(limit, cursor)` → inbox list, sorted by `updatedAt` desc.
- `conversation(id)` → single conversation with participants.
- `messages(conversationId, limit, cursor)` → paginated history (`_id < cursor`).

Mutations
- `createConversation(participantIds, isGroup, name?)` → finds-or-creates a DM
  (enforce a canonical 2-participant lookup so the same DM isn't duplicated).
- `sendMessage(conversationId, text?, mediaUrls?)` → creates Message, updates
  `lastMessage` + `updatedAt`, triggers realtime + notification.
- `markConversationRead(conversationId)` → adds user to `readBy` / updates
  `lastReadMessageId`.
- `addParticipants` / `leaveConversation` (group management).

### 5.3 Realtime events (Pusher)
On `sendMessage`:
- `trigger('private-conversation-<id>', 'message:new', message)` — live append.
- `trigger('private-user-<recipientId>', 'conversation:updated', preview)` —
  updates inbox + unread badge for users not currently in the thread.

Typing indicators via client-triggered events on the presence channel
(`client-typing`), or a lightweight `setTyping` mutation → `message:typing`.

### 5.4 Frontend
- New stack under a **Messages** tab (add to `RootNavigator`):
  - `ConversationsScreen` — inbox list, unread badges, last-message preview.
  - `ChatScreen` — inverted `FlatList` message thread, composer, media button,
    typing indicator, read receipts; subscribes to the conversation channel via
    `useRealTime`, cursor-paginates history on scroll-up.
  - `NewConversationScreen` — pick user(s) from follow graph to start a chat.
- Apollo cache: append incoming `message:new` to the `messages` query cache;
  bump the conversation to the top of `conversations` on `conversation:updated`.
- Entry points: "Message" button on `ProfileScreen`, inbox icon on `FeedScreen`.

### 5.5 Explicitly out of scope for Phase 1 (flag, don't fake)
- End-to-end encryption, message editing/deletion, reactions on messages,
  voice/video calls, disappearing messages. Note these as future work.

### 5.6 Suggested slice order
1. Private channel auth (5.0) — unblocks everything.
2. Schemas + `sendMessage`/`messages`/`conversations` (text only).
3. Inbox + Chat screens (text only, realtime append).
4. Read receipts + unread badges.
5. Media messages (reuse Cloudinary).
6. Typing indicators + group chat.

---

## 6. Phases 2–9 (scoped, to be detailed later)

### Phase 2 — Feed richness
- **Hashtags & mentions**: parse `#tag` / `@user` from captions, index them,
  make them tappable, add hashtag/mention feeds.
- **Saved / bookmarked posts**: `Save` collection + saved-posts screen.
- **Shares / reposts**: quote or reshare a post into your feed.
- **Rich media**: multi-image carousels (schema already stores `mediaUrls[]`).
- Reuses the existing feed cursor + Redis patterns.

### Phase 3 — Professional networking (LinkedIn-inspired)
- **Rich profiles**: extend `User` with headline, work experience, education,
  skills, and location — profile becomes a professional identity, not just
  avatar + bio.
- **Connections**: a *bidirectional* relationship (request → accept) alongside
  the existing one-way follow. New `Connection` schema + request/accept flow;
  keeps follows for casual, connections for professional graph.
- **Articles / long-form posts**: a richer post type with title + body for
  LinkedIn-style write-ups, distinct from short captioned media posts.
- **Endorsements / skills** (optional stretch): endorse a connection's skills.
- Feed surfaces both post types; profile shows experience + connections count.

### Phase 4 — Stories
- `Story` schema with `expiresAt` (TTL index for auto-cleanup), viewers list.
- Stories tray at top of feed, full-screen tap-through story viewer, seen state.
- Realtime "new story from someone you follow" event.

### Phase 5 — Reels / short video
- Vertical, snap-scrolling video feed (`FlatList` paging + `expo-video`).
- Video upload/transcoding via Cloudinary; thumbnails; autoplay-on-focus.
- Biggest media-infra lift — likely wants a proper upload/processing pipeline.

### Phase 6 — Discovery & search
- Search users / posts / hashtags (Mongo text indexes → later a search engine).
- Ranked Explore (engagement-weighted rather than pure reverse-chron).
- Suggested-users / people-you-may-know.

### Phase 7 — Push notifications
- Expo Push tokens stored per user/device; push on new message, reaction,
  comment, follow. Bridges the "app not foregrounded" gap in realtime.

### Phase 8 — Groups / Pages / Events
- Communities with membership + roles, business Pages, Events with RSVP.
- Group-scoped feeds; extends the follow/feed model to many-to-many membership.

### Phase 9 — Cross-cutting polish (ongoing)
- **Safety**: block/mute/report, content moderation, private-account
  follow-request flow (the `isPrivate` flag exists but isn't enforced yet).
- **Account**: settings, edit profile, password reset, account deletion.
- **Infra**: rate limiting, input validation, structured media pipeline,
  observability. (Deferred given the learning scope, but tracked here.)

---

## 7. Recommended immediate next step

**Phase 0 (design-system foundation) first** — a small, self-contained slice
that makes every later screen consistent across the Instagram/Facebook/LinkedIn
blend and is cheap to build now, expensive to retrofit later.

Then **Phase 1, slice 1 (private channel auth)** → **slice 2 (text messaging
schema + API)**. These unblock a visible, end-to-end realtime chat and exercise
the full stack (auth, GraphQL, Mongo, Pusher, Apollo cache) — ideal for the
learning goal.

When ready, say the word and I'll implement slice by slice.
