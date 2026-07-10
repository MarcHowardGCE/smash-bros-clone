# smash-clone justfile
# Run `just` to see all commands.

# Default: list available commands
default:
    @just --list

# ─────────────────────────────────────────────
# PLAY
# Start server + client, open browser, shut down
# everything cleanly on exit (Ctrl+C or tab close).
# ─────────────────────────────────────────────
play:
    #!/usr/bin/env bash
    set -euo pipefail

    SERVER_PORT=3001
    CLIENT_PORT=5173
    SERVER_LOG=/tmp/smash-server.log
    CLIENT_LOG=/tmp/smash-client.log

    # ── cleanup function ──────────────────────────────────────────────────────
    cleanup() {
        echo ""
        echo "Stopping smash-clone..."

        # Kill by PID files if we have them
        if [ -f /tmp/smash-server.pid ]; then
            kill "$(cat /tmp/smash-server.pid)" 2>/dev/null || true
            rm -f /tmp/smash-server.pid
        fi
        if [ -f /tmp/smash-client.pid ]; then
            kill "$(cat /tmp/smash-client.pid)" 2>/dev/null || true
            rm -f /tmp/smash-client.pid
        fi

        # Belt-and-suspenders: kill anything still holding the ports
        lsof -ti:${SERVER_PORT} 2>/dev/null | xargs kill -9 2>/dev/null || true
        lsof -ti:${CLIENT_PORT} 2>/dev/null | xargs kill -9 2>/dev/null || true

        echo "All processes stopped. Goodbye."
    }

    # Register cleanup on any exit signal
    trap cleanup EXIT INT TERM

    # ── check ports are free ─────────────────────────────────────────────────
    if lsof -ti:${SERVER_PORT} > /dev/null 2>&1; then
        echo "Port ${SERVER_PORT} is already in use. Run 'just stop' first."
        exit 1
    fi
    if lsof -ti:${CLIENT_PORT} > /dev/null 2>&1; then
        echo "Port ${CLIENT_PORT} is already in use. Run 'just stop' first."
        exit 1
    fi

    # ── start server ─────────────────────────────────────────────────────────
    echo "Starting game server on :${SERVER_PORT}..."
    pnpm -F @smash/server dev > "${SERVER_LOG}" 2>&1 &
    echo $! > /tmp/smash-server.pid

    # Wait for server to be ready
    for i in $(seq 1 20); do
        if grep -q "listening on port" "${SERVER_LOG}" 2>/dev/null; then
            break
        fi
        if [ "$i" -eq 20 ]; then
            echo "Server failed to start. Check ${SERVER_LOG}"
            exit 1
        fi
        sleep 0.3
    done
    echo "  Server ready."

    # ── start client ─────────────────────────────────────────────────────────
    echo "Starting game client on :${CLIENT_PORT}..."
    pnpm -F @smash/client dev > "${CLIENT_LOG}" 2>&1 &
    echo $! > /tmp/smash-client.pid

    # Wait for Vite to be ready
    for i in $(seq 1 20); do
        if grep -q "ready in" "${CLIENT_LOG}" 2>/dev/null; then
            break
        fi
        if [ "$i" -eq 20 ]; then
            echo "Client failed to start. Check ${CLIENT_LOG}"
            exit 1
        fi
        sleep 0.3
    done
    echo "  Client ready."

    # ── open browser ─────────────────────────────────────────────────────────
    echo ""
    echo "Opening http://localhost:${CLIENT_PORT} ..."
    open "http://localhost:${CLIENT_PORT}" 2>/dev/null \
        || xdg-open "http://localhost:${CLIENT_PORT}" 2>/dev/null \
        || echo "  (Could not open browser automatically — visit http://localhost:${CLIENT_PORT})"

    echo ""
    echo "┌──────────────────────────────────────────────────────┐"
    echo "│  smash-clone is running                              │"
    echo "│                                                      │"
    echo "│  Game:    http://localhost:${CLIENT_PORT}                 │"
    echo "│  Server:  ws://localhost:${SERVER_PORT}                   │"
    echo "│                                                      │"
    echo "│  How to play:                                        │"
    echo "│    1. Click 'Create Room'                            │"
    echo "│    2. Share the URL with a friend                    │"
    echo "│    3. Both click Ready — fight!                      │"
    echo "│                                                      │"
    echo "│  Press Ctrl+C to stop everything.                   │"
    echo "└──────────────────────────────────────────────────────┘"
    echo ""

    # ── block until Ctrl+C or process death ──────────────────────────────────
    # Wait for either child process to exit (handles crashes)
    SERVER_PID=$(cat /tmp/smash-server.pid 2>/dev/null || echo "")
    CLIENT_PID=$(cat /tmp/smash-client.pid 2>/dev/null || echo "")

    while true; do
        # Check if either process died unexpectedly
        if [ -n "${SERVER_PID}" ] && ! kill -0 "${SERVER_PID}" 2>/dev/null; then
            echo ""
            echo "Server process exited unexpectedly. Check ${SERVER_LOG}"
            break
        fi
        if [ -n "${CLIENT_PID}" ] && ! kill -0 "${CLIENT_PID}" 2>/dev/null; then
            echo ""
            echo "Client process exited unexpectedly. Check ${CLIENT_LOG}"
            break
        fi
        sleep 1
    done

    # cleanup runs via trap on EXIT

# ─────────────────────────────────────────────
# DEV
# Start server + client without opening browser.
# Useful for multiple terminal windows.
# ─────────────────────────────────────────────
dev:
    #!/usr/bin/env bash
    set -euo pipefail

    SERVER_LOG=/tmp/smash-server.log
    CLIENT_LOG=/tmp/smash-client.log

    cleanup() {
        echo ""
        echo "Stopping smash-clone..."
        if [ -f /tmp/smash-server.pid ]; then
            kill "$(cat /tmp/smash-server.pid)" 2>/dev/null || true
            rm -f /tmp/smash-server.pid
        fi
        if [ -f /tmp/smash-client.pid ]; then
            kill "$(cat /tmp/smash-client.pid)" 2>/dev/null || true
            rm -f /tmp/smash-client.pid
        fi
        lsof -ti:3001 2>/dev/null | xargs kill -9 2>/dev/null || true
        lsof -ti:5173 2>/dev/null | xargs kill -9 2>/dev/null || true
        echo "Done."
    }
    trap cleanup EXIT INT TERM

    echo "Starting server..."
    pnpm -F @smash/server dev > "${SERVER_LOG}" 2>&1 &
    echo $! > /tmp/smash-server.pid

    echo "Starting client..."
    pnpm -F @smash/client dev > "${CLIENT_LOG}" 2>&1 &
    echo $! > /tmp/smash-client.pid

    echo ""
    echo "Server:  http://localhost:3001  (logs: ${SERVER_LOG})"
    echo "Client:  http://localhost:5173  (logs: ${CLIENT_LOG})"
    echo ""
    echo "Press Ctrl+C to stop."

    wait

# ─────────────────────────────────────────────
# STOP
# Kill any running server/client processes.
# ─────────────────────────────────────────────
stop:
    #!/usr/bin/env bash
    echo "Stopping smash-clone processes..."
    if [ -f /tmp/smash-server.pid ]; then
        kill "$(cat /tmp/smash-server.pid)" 2>/dev/null && echo "  Server stopped." || true
        rm -f /tmp/smash-server.pid
    fi
    if [ -f /tmp/smash-client.pid ]; then
        kill "$(cat /tmp/smash-client.pid)" 2>/dev/null && echo "  Client stopped." || true
        rm -f /tmp/smash-client.pid
    fi
    lsof -ti:3001 2>/dev/null | xargs kill -9 2>/dev/null && echo "  Cleared :3001" || true
    lsof -ti:5173 2>/dev/null | xargs kill -9 2>/dev/null && echo "  Cleared :5173" || true
    echo "Done."

# ─────────────────────────────────────────────
# BUILD
# Compile all packages.
# ─────────────────────────────────────────────
build:
    pnpm build

# ─────────────────────────────────────────────
# TEST
# Run all engine unit tests (67 tests).
# ─────────────────────────────────────────────
test:
    pnpm -F @smash/engine test --run

# ─────────────────────────────────────────────
# LOGS
# Tail live server and client logs.
# ─────────────────────────────────────────────
logs:
    #!/usr/bin/env bash
    echo "=== Server log: /tmp/smash-server.log ==="
    echo "=== Client log: /tmp/smash-client.log ==="
    echo ""
    tail -f /tmp/smash-server.log /tmp/smash-client.log 2>/dev/null \
        || echo "No logs yet. Run 'just play' first."

# ─────────────────────────────────────────────
# CLEAN
# Remove all build artifacts and node_modules.
# ─────────────────────────────────────────────
clean:
    #!/usr/bin/env bash
    echo "Cleaning build artifacts..."
    find . -name "dist" -not -path "*/node_modules/*" -type d -exec rm -rf {} + 2>/dev/null || true
    find . -name "*.tsbuildinfo" -not -path "*/node_modules/*" -exec rm -f {} + 2>/dev/null || true
    echo "Cleaning node_modules..."
    find . -name "node_modules" -maxdepth 3 -type d -exec rm -rf {} + 2>/dev/null || true
    echo "Done. Run 'pnpm install' to reinstall."

# ─────────────────────────────────────────────
# INSTALL
# Install all dependencies.
# ─────────────────────────────────────────────
install:
    pnpm install
