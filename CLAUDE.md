# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Dev server with Turbopack
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Vitest (jsdom)
npm run setup        # npm install + prisma generate + prisma migrate dev
npm run db:reset     # Force reset SQLite database
```

Run a single test file: `npx vitest src/lib/__tests__/file-system.test.ts`

## Architecture

**UIGen** is an AI-powered React component generator with live preview. Users describe components in chat; Claude generates them via tool calls; results render in a sandboxed iframe — no disk writes.

### Component Generation Flow

1. User submits prompt → `useChat()` → POST `/api/chat/route.ts`
2. API route reconstructs the VirtualFileSystem from serialized state, calls `streamText()` with Claude (`claude-haiku-4-5` via `@ai-sdk/anthropic`)
3. Claude uses `str_replace_editor` and `file_manager` tools to create/edit files in the VFS
4. Tool results stream back; the client's `onToolCall` handler applies changes to its local VirtualFileSystem
5. VFS changes trigger a `refreshTrigger` in `FileSystemContext`, causing `PreviewFrame` to re-render

### Virtual File System (`src/lib/file-system.ts`)

All generated files live in an in-memory `Map<path, FileNode>`. Never written to disk. Serialized to JSON for persistence (SQLite for auth'd users, localStorage for anonymous). Core ops: `createFile`, `createDirectory`, `replaceInFile`, `viewFile`, `insertInFile`.

### Browser Rendering Pipeline (`src/components/preview/`)

- `createImportMap()` processes each file's imports and creates blob URLs
- `createPreviewHTML()` wraps everything in an HTML doc with `<script type="importmap">`
- Babel standalone transforms JSX → JS in-browser
- Renders inside a sandboxed iframe (`allow-scripts allow-same-origin allow-forms`)
- Missing imports get placeholder modules to prevent render crashes

### Claude Integration (`src/lib/provider.ts`, `src/lib/prompts/`)

- System message uses `providerOptions: { anthropic: { cacheControl: { type: "ephemeral" } } }` for prompt caching
- Falls back to `MockLanguageModel` (returns hardcoded static components) when no `ANTHROPIC_API_KEY` is set — no API key needed to demo the UI
- Real Claude: 40 max steps; Mock: 4 max steps

### Auth (`src/lib/auth.ts`, `src/middleware.ts`)

- JWT-based, 7-day expiry, stored in httpOnly secure cookies
- Anonymous users supported; `src/lib/anon-work-tracker.ts` detects unsaved work before sign-in
- Authenticated projects saved to SQLite via Prisma (`messages` and `data` stored as JSON strings)

### Key Directories

```
src/app/api/chat/route.ts   — Streaming chat endpoint
src/app/main-content.tsx    — 3-panel layout (chat | preview/code)
src/lib/file-system.ts      — VirtualFileSystem class
src/lib/tools/              — str_replace_editor, file_manager tool definitions
src/lib/contexts/           — ChatContext, FileSystemContext (shared state)
src/lib/transform/          — JSX → JS via Babel
src/actions/                — Server actions for project CRUD
src/components/preview/     — iframe rendering + import map generation
```

### Conventions

- All imports use `@/` alias (configured in `tsconfig.json`)
- Tests co-located in `__tests__/` subdirectories alongside source
- Server actions marked with `"use server"` directive
- Shadcn/Radix UI primitives live in `src/components/ui/`
