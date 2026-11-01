# Gignology Solutions

A cinematic marketing website with a protected owner workspace, direct inquiries, discovery-call requests, and controlled case-study publishing.

## Source
- `web/index.html`: complete marketing document served by the root Vinext route.
- `web/owner.html`: protected owner workspace.
- `public/`: styles, browser scripts, generated editorial imagery, supplied brand identity, and optimized desktop/mobile hero MP4s.
- `server/api.ts`: server validation, owner authorization, persistent records, and public content projection.
- `db/schema.ts` and `drizzle/`: schema and immutable generated migrations.

## Product behavior
One bottom “Let’s talk” section contains one shared form. An optional call checkbox reveals scheduling fields; each submission creates either an inquiry or a discovery request. Inquiries are saved directly to the owner inbox. Discovery requests record the visitor’s date, time, and timezone preference; the owner confirms arrangements manually. This does not create an external calendar event or send an email automatically. The owner can supply an existing HTTPS scheduling link in Settings.

Case studies start as private drafts. Publication requires complete project details plus an accuracy/permission confirmation. No invented clients, metrics, or project outcomes are seeded. Only published, permission-confirmed stories are exposed by the public API.

Owner access uses dispatch-authenticated identity. The first owner sign-in must match the verified owner email configured in the runtime `OWNER_EMAIL` value; the application then binds that Site-specific user ID. Later visitors cannot claim ownership. Keep the existing Sites audience and auth boundary.

## Development and validation
Use the Sites install/build/preview helpers described by the project starter. Generate schema changes with `npm run db:generate`; apply local migrations through the starter’s Wrangler D1 command. Local preview and production data are separate.

Run the SQLite-backed API integration checks with `node --experimental-transform-types tests/integration.mjs` on Node 24. The tests use an ephemeral in-memory database and verify owner authorization and identity binding, cross-origin rejection, bounded input, durable inquiry/booking writes, retries, publication boundaries, and URL validation. They do not create production records.

Browser verification covered desktop/phone layouts, hero playback and pause, service/sprint tabs, guide prefill, and actual inquiry/call-request submission into local D1. Owner layout was visually reviewed with temporary empty fixtures; authorization and owner CRUD were tested through the server integration suite. Temporary QA views are not shipped.

## Media provenance
The supplied Gignology logo is retained. Built-in ImageGen created the clean hero scene and two conceptual editorial images: connected infrastructure and a human strategy workspace. They illustrate the subject and do not depict actual Gignology premises or clients. The hero scene was animated into a silent rotating-G loop (task cea7ee88-3389-4053-9c63-1fe3852eaf9d), with closely matched first/last frames. The site uses static fallback imagery, muted inline video, manual pause, reduced-motion/data-saver defaults, and offscreen/background pause.

## Content
Service positioning was grounded in https://www.gignologysolutions.com/ on October 31, 2026. Decorative arrows were removed at the user’s request. The main proposition is “Build what’s next. Lead with confidence.”

## Run a GitHub checkout locally

Use Node 24 and pnpm 11.25.0. Install pnpm if it is not already available, then run:

```sh
pnpm install --frozen-lockfile
pnpm build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_absent_freak.sql
pnpm dev
```

Apply the initial migration once per new local database. Add later generated migrations in order. The dev server prints its local URL. `pnpm start` previews the built Worker after a build.

For local owner testing with the starter’s loopback-only mock sign-in, create an untracked `.dev.vars` containing `OWNER_EMAIL=seedy@sites.test`, then follow `/signin-with-chatgpt?return_to=/owner`. Managed previews and production do not use that mock identity. Production requires Sites dispatch authentication, the D1 binding, and a verified owner email configured as a runtime secret; these runtime values and database records are intentionally absent from the repository.

## Mobile layouts

A shared `public/mobile.css` provides touch-sized controls, readable labels and form text, safe fixed-header anchor offsets, and compact spacing for short phones. Both the public site and owner workspace load it. The mobile hero uses its own optimized MP4.
