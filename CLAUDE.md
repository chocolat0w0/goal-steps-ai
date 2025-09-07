# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Top-Level Rules

- To maximize efficiency, **if you need to execute multiple independent processes, invoke those tools concurrently, not sequentially**.
- **You must think exclusively in English**. However, you are required to **respond in Japanese**.
- When all TODOs are completed or user action is required, run the `afplay /System/Library/Sounds/Soumi.aiff` command once to notify.

## Repository Overview

This is a test repository for Claude Code environment setup (claude-code の環境構築テスト). The repository is designed as a sandbox environment for testing Claude Code functionality within a DevContainer.

## Development Environment

### DevContainer Setup

The repository uses a comprehensive DevContainer configuration with:

- **Base**: Node.js 20
- **Shell**: Zsh with Powerline10k theme and fzf integration
- **Editor**: Configured for VS Code with Prettier formatting and ESLint
- **Tools**: Git Delta for enhanced diffs, GitHub CLI, and Claude Code CLI pre-installed

### Key DevContainer Features

- **Automatic formatting**: Format on save with Prettier
- **ESLint integration**: Automatic linting and fixes
- **Persistent volumes**: Command history and Claude config are preserved across container rebuilds
- **Network capabilities**: Enhanced with NET_ADMIN and NET_RAW for advanced networking
- **Firewall setup**: Custom firewall initialization via `init-firewall.sh`

## Architecture

This is a minimal test repository with:

- DevContainer configuration in `.devcontainer/`
- Custom firewall initialization script for network security testing
- Git repository with clean commit history

## Environment Configuration

- **Working directory**: `/workspace`
- **User**: `node` (non-root for security)
- **Node memory**: Configured with `--max-old-space-size=4096`
- **Default editor**: nano
- **Shell**: zsh with enhanced history and fzf integration
