# AGENTS.md

## Project
Build and maintain a small Node.js + TypeScript bot that posts Istanbul dam occupancy data to X twice per day.

## Goal
- Fetch the latest Istanbul dam occupancy data from the official İSKİ source.
- Normalize the data into a stable internal format.
- Generate a concise Turkish post.
- Publish to X on a schedule.
- Keep the project simple, testable, and cheap to run.

## Product rules
- Primary language: Turkish.
- Always prefer official data from İSKİ.
- Never invent a percentage. If parsing fails or the data looks suspicious, do not post.
- If the source structure changes, fail safely and log the reason.
- Do not post duplicate content if the latest snapshot is identical to the previous successful post unless the command explicitly forces a post.
- Do not promise monetization outcomes. Treat monetization as optional upside, not a product requirement.

## Engineering rules
- Stack: Node.js, TypeScript, npm.
- Keep dependencies minimal.
- Prefer pure functions for parsing, formatting, and comparison.
- Put all external integrations behind small adapters:
  - `src/lib/iski.ts`
  - `src/lib/x.ts`
  - `src/lib/store.ts`
- Use environment variables for all secrets.
- Use structured logs with clear error messages.
- Add comments only where they clarify non-obvious logic.
- Do not over-engineer. This is a small automation project.

## Expected commands
- `npm run dev` → local development
- `npm run check` → typecheck
- `npm run post` → fetch + generate + publish immediately
- `npm run dry-run` → fetch + generate + print without publishing

## Suggested milestones
1. Implement İSKİ fetcher and parser.
2. Implement tweet text generator.
3. Add duplicate-post protection with local JSON state.
4. Implement X posting adapter.
5. Add scheduler for twice-daily posting.
6. Add deployment target.
7. Add simple tests for parser and formatter.

## Posting policy
Use a neutral, informative tone.
Avoid political framing.
Keep posts short and readable.
Suggested format:

`İstanbul baraj doluluk oranı: %X,XX`
`Tarih: DD.MM.YYYY HH:mm`
`Kaynak: İSKİ`

Optional second line:
- daily change if a previous snapshot exists
- one or two top/bottom reservoirs if verified and useful

## Safe failure behavior
If İSKİ data cannot be parsed:
- log the failure,
- skip posting,
- exit with non-zero status.

If X API posting fails:
- log the request context without secrets,
- preserve the fetched snapshot,
- do not mark as successfully posted.

## What Codex should do first
1. Read `README.md`.
2. Verify `.env.example` keys.
3. Run `npm install`.
4. Run `npm run dry-run`.
5. Only after dry-run works, integrate the real X credentials.

## Non-goals
- Dashboard
- Database
- Multi-account support
- AI-generated thread spam
- Growth hacking tactics
