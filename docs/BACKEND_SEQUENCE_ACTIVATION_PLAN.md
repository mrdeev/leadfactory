# Backend Sequence Activation Plan

## How the Repo Maps to Sequence Execution

The existing codebase uses file-based JSON storage (`src/data/*.json`) with no ORM or database. Email sending goes through `src/lib/email.ts` which supports SES, Mailgun, SendGrid, and SMTP. AI generation uses Groq via the `openai` package. LinkedIn data currently comes only from Apify post scraping (`supreme_coder/linkedin-post`). There is no existing queue system — all triggers are manual API calls.

The new sequence system extends these patterns without replacing them.

## Services Extended (not replaced)

- `src/lib/db.ts` — new interface fields + new file-backed helpers for sequence states and jobs
- `src/lib/email.ts` → `sendEmail()` — reused directly by the EMAIL_SEND handler
- Groq client — reused directly for email generation in ACTION_ROUTER
- `apify-client` — extended for LinkedIn automation (visit, invite, check, message)
- `src/data/campaign_activity.json` — reused for execution logging
- `src/data/messages.json` — reused for sent-email records

## New Files

| File | Role |
|---|---|
| `src/lib/sequence-graph.ts` | Defines the hardcoded multi-channel node graph |
| `src/lib/action-router.ts` | Dispatches each node type to its handler |
| `src/lib/linkedin-automation.ts` | LinkedIn actions via Apify + li_at cookie |
| `src/data/sequence_states.json` | Per-lead current node + timing |
| `src/data/sequence_jobs.json` | File-based job queue |
| `src/data/tasks.json` | Call-task records |
| `src/app/api/cron/sequence-runner/route.ts` | Cron endpoint (enqueue only, returns immediately) |
| `src/app/api/sequence/worker/route.ts` | Worker: pop one job → execute → advance |
| `src/app/api/sequence/runner/route.ts` | Manual trigger for testing |
| `src/app/api/linkedin/connect/route.ts` | Save li_at cookie to product |
| `src/app/api/linkedin/status/route.ts` | Verify li_at cookie validity |
| `src/app/api/sequence/tasks/route.ts` | Call-task CRUD |
| `vercel.json` | Hourly Vercel cron |

## Worker Design

The cron endpoint (`GET /api/cron/sequence-runner`) queries `sequence_states.json` for states where `sequenceWaitUntil <= now`, writes pending job records to `sequence_jobs.json`, fires a fire-and-forget POST to `/api/sequence/worker`, and returns immediately. The worker pops one pending job, calls `ActionRouter.execute()`, advances the lead's state, and logs the result. One job per worker invocation keeps execution serverless-safe.

## Data Flow: UI → Backend → Execution

```
"Launch" button → POST /api/campaign/launch
  → email1 generated + sent (existing logic)
  → sequence_states.json: { leadId, nodeId:'visit', sequenceWaitUntil: now+1d }

Hourly Vercel cron → GET /api/cron/sequence-runner
  → finds due states → writes to sequence_jobs.json → fires worker

Worker → POST /api/sequence/worker
  → ActionRouter.execute('visit', lead, product)
  → Apify visits LinkedIn profile with stored li_at cookie
  → state advanced to { nodeId:'invite', sequenceWaitUntil: now+1d }

... (invite → condition → YES/NO branch → final email) ...
```

## Risk Analysis

| Risk | Mitigation |
|---|---|
| LinkedIn bans for automation | Rate-limit 30 visits/day; hourly cron limits burst volume |
| Apify actor unavailable | Handler logs skip + advances state (non-blocking) |
| JSON file write conflicts | Cron hourly max; worker processes one job at a time |
| li_at cookie expiry | `/api/linkedin/status` validates; product shows reconnect prompt |
| Groq rate limits | 300ms delay between contacts (matches existing pattern) |
| File size growth | Completed jobs purged after 30 days on each cron run |
