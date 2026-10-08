# AGENTS.md

## Repository Overview
- **Purpose**: OpenCode testbed and sandbox for testing OpenCode features, tool calls, agent workflows, and prompt behaviors.
- **State**: Sandbox environment; files and subdirectories are typically test fixtures or experimental spikes.

## Environment & Shell Quirks
- **Platform**: Windows (`win32`) using PowerShell.
- **Shell Commands**: Write PowerShell-compatible commands. Avoid bash-specific syntax (e.g. `&&`, export flags). Avoid noisy command chaining.
- **Temp Directory**: Prefer `C:\Users\aliav\AppData\Local\Temp\opencode` for temporary external files over generic unix paths like `/tmp`.

## Workflow Guidelines
- Prefer dedicated file tools (`read`, `edit`, `write`, `glob`, `grep`) over invoking shell commands.
- Keep test experiments, fixtures, and scratchpads self-contained so tests do not interfere with each other.
- When committing or pushing, verify untracked test scratchpads to avoid committing accidental artifacts.
