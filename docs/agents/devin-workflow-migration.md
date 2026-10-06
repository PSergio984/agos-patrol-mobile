# Devin workflow migration (from Antigravity/Gemini)

Reference for how this machine's Antigravity IDE + Gemini CLI setup maps onto
Devin. Source configs live under `~/.gemini/`; Devin equivalents live under
`~/.devin/`, `~/.agents/skills/`, and `%APPDATA%/devin/`.

## MCP servers

| Gemini/Antigravity server | Devin status                                                   | Config location                   |
| ------------------------- | -------------------------------------------------------------- | --------------------------------- |
| `context-mode` (stdio)    | Added globally                                                 | `%APPDATA%/devin/mcp_config.json` |
| `unityMCP` (http :8085)   | Already present                                                | `%APPDATA%/devin/mcp_config.json` |
| `Neon` (remote)           | Already present                                                | Devin MCP config                  |
| `laravel-boost`           | Skipped — scoped to `d:\Nexvision\NexHRIS-SaaS`, not this repo | —                                 |
| `claude-mem`              | Already present                                                | Devin MCP config                  |

`context-mode` is the one that matters: the global rules file mandates
`ctx_*` sandboxed execution for data processing, bulk shell, and web fetches.
Without the server those rules were dead letters.

## Hooks (`hooks.v1.json`)

Devin hooks use Claude-Code-style events (`SessionStart`, `UserPromptSubmit`,
`PreToolUse`, `PostToolUse`, `Stop`, `PostCompact`) with a regex `matcher` on
tool names. Devin tool names differ from Gemini's, so matchers were remapped:

| Gemini matcher | Devin matcher |
| -------------- | ------------- |
| `Bash`         | `^exec$`      |
| `Read`         | `^read$`      |
| `Write         | Edit          | MultiEdit`       | `^(write\|edit)$` |
| `Agent         | Task`         | `^run_subagent$` |

The ported hook set (all under `~/.gemini/antigravity/hooks/`):

- **SessionStart**: `gsd-check-update.js`, `gsd-session-state.sh`,
  `gsd-update-banner.js`, `context-mode hook devin sessionstart`,
  claude-mem context feed
- **UserPromptSubmit**: claude-mem session-init (was `BeforeAgent`)
- **PreToolUse**: `gsd-prompt-guard.js`, `gsd-read-guard.js`,
  `gsd-workflow-guard.js`, `gsd-validate-commit.sh`,
  `gsd-worktree-path-guard.js`, `gsd-agent-isolation-guard.js`,
  `gsd-write-guard.js`, `context-mode hook devin beforetool`,
  claude-mem observation
- **PostToolUse**: `gsd-context-monitor.js`, `gsd-read-injection-scanner.js`,
  `gsd-phase-boundary.sh`, `gsd-graphify-update.sh`,
  `context-mode hook devin aftertool`, claude-mem observation
- **Stop** (was `AfterAgent`): claude-mem observation
- **PostCompact** (was `PreCompress`): context-mode precompress +
  claude-mem summarize

Caveats:

- Devin's stdin payload is Claude-shaped (`tool_name`, `tool_input`,
  `tool_response`, `session_id`, `transcript_path`), which GSD scripts
  already parse. Hooks that inspect `tool_input.command` still work because
  `exec` takes `command` too.
- Gemini's `PreCompress` has no exact pre-event in Devin; it's wired to
  `PostCompact` (post-compaction) — close enough for claude-mem's summarize.
- Devin has no `Notification` event consumer that matters here; the
  claude-mem observation feed is kept on it anyway as a no-op fallback.

## Skills

- Antigravity's skill store (`~/.gemini/antigravity-ide/skills/`, ~1500
  entries) is synced into `~/.agents/skills/` — a Devin-discovered global
  skill dir.
- GSD slash commands (`~/.gemini/commands/gsd/*.toml`, 67 files) are
  converted to `~/.agents/skills/gsd-<name>/SKILL.md`. In Devin a skill is
  both a slash command and an auto-triggered context blob, so the TOML
  `prompt` becomes the SKILL.md body verbatim.
- `~/.gemini/antigravity-ide/global_workflows/` (prompt-engineer,
  thinking-beast-gemini) converted the same way.

## Rules

`~/.gemini/GEMINI.md` is identical to `~/.claude/CLAUDE.md`, which Devin
already loads as an always-on rule. Nothing to port.

## Known gaps

- GSD hooks assume Claude/Gemini tool names and `.planning/` state
  conventions; guards that pattern-match on `Bash` internals (e.g.
  `gsd-validate-commit.sh` checking `git commit`) still work since Devin's
  `exec` passes a `command` string, but behavioral parity isn't guaranteed —
  watch the first sessions and tune matchers.
- The Antigravity skill server (`skills.txt` → `http://127.0.0.1:8989`) has
  no Devin equivalent; Devin discovers skills statically from the dirs above.
