# AGENTS.md instructions for /Users/chandler/code/Mitraauto-main

## Project Environment

Use the Mitra project wrapper before backend, Supabase, or deployment work:

```bash
source ~/.config/projects/bin/project
project mitraauto
```

`project mitraauto` should load:

```text
PROJECT_DIR=/Users/chandler/code/Mitraauto-main
PROJECT_SLUG=mitraauto
SUPABASE_PROJECT_REF=rcmmbwdebnmicrweoiyz
SUPABASE_URL=https://rcmmbwdebnmicrweoiyz.supabase.co
```

The database password must stay in macOS Keychain under:

```text
service: mitraauto.supabase.db
account: postgres
```

Do not write the database password into repo files or project env files. The project env file derives `DATABASE_URL`, `SUPABASE_TRANSACTION_POOLER_URL`, and `SUPABASE_SESSION_POOLER_URL` from Keychain.

## Supabase MCP

Do not use a generic MCP server named `supabase` for this workspace. It is too easy for another chat/project to point that name at the wrong Supabase project.

Use the project-specific MCP server:

```text
supabase-mitra  project_ref=rcmmbwdebnmicrweoiyz
```

Before reading or changing Supabase state, verify:

```bash
codex mcp get supabase-mitra
```

If authentication is missing, authenticate only the project-specific server:

```bash
codex mcp login supabase-mitra
```

Never run schema changes, migrations, SQL, storage edits, or Edge Function work until the active Supabase project ref is confirmed as `rcmmbwdebnmicrweoiyz`.

