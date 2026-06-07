# Self-hosting WordWolf

WordWolf is designed to run without Docker. The self-host helper uses tmux for Node processes and writes a marked block into `~/Caddyfile`.

## Requirements

- Node.js and pnpm
- tmux
- Caddy, with permission to reload `~/Caddyfile`
- A DNS name or local hostname pointing at the server

If your network needs proxy variables for downloads, export them before running the script. The script passes existing proxy environment variables into tmux sessions with tmux's hardened `-e "VARIABLE=value"` syntax; it does not hardcode proxy URLs.

## Commands

```bash
./self_host.py setup [url]
./self_host.py redeploy [url]
./self_host.py start [url]
./self_host.py stop
./self_host.py dev-start [url]
```

Default URL: `https://wordwolf.pinky.lilf.ir`.

- `setup`: stops existing sessions, installs dependencies with pnpm, builds, configures Caddy, then starts production.
- `redeploy`: stops existing sessions, installs/builds latest local changes, then starts production.
- `start`: stops prod/dev sessions, configures Caddy for production, then starts production.
- `stop`: kills WordWolf tmux sessions.
- `dev-start`: stops prod/dev sessions, configures Caddy to proxy the hot-reload dev frontend, and starts dev sessions.

The script checks required localhost ports before starting. Defaults:

- Backend/prod Node: `3101` (`WORDWOLF_BACKEND_PORT`)
- Dev frontend: `3100` (`WORDWOLF_DEV_FRONTEND_PORT`)

## Caddy behavior

The script manages only the block between:

```caddy
# BEGIN WORDWOLF SELF HOST
# END WORDWOLF SELF HOST
```

For HTTPS URLs, it also writes an explicit HTTP-to-HTTPS redirect block. For HTTP URLs, it writes an explicit HTTPS-to-HTTP redirect block.

Production Caddy serves Next static assets directly from `.next/static` and public assets from `public/`, while proxying dynamic pages, API endpoints, and Socket.IO to the local Node process. Development mode proxies the frontend to the hot-reload dev server and API/websockets to the backend.

## Intranet/browser notes

- No captcha or Firebase is used.
- Runtime assets are local; no Google font or external social/rules links are required.
- WebSockets use the current browser origin/protocol, so HTTP uses `ws` and HTTPS uses `wss` automatically through Socket.IO.
- Copying migration links works on HTTP by falling back to a temporary textarea copy path when `navigator.clipboard` is unavailable.

## Identity and moderation

Users enter one visible **display name** on the homepage. Existing rooms are joined from room links; the homepage does not ask for lobby names. Identity is a hidden random auth token stored in browser localStorage alongside that display name. Server room state is in memory and may reset on process restart; the browser's auth token/display name remains available locally. If duplicate display names join the same room, stable room-scoped numbers are appended automatically.

Spectators and observers are separate states:

- **Spectator**: no reserved seat, not an active player.
- **Observer**: seated but inactive, seat remains reserved, can rejoin themself or be joined back by a moderator.

The room creator is the permanent owner. Owners and moderators can promote moderators. Moderators can demote only moderators they promoted. If no owner/real moderator is online for five minutes, the server activates a temporary moderator; temporary moderators have full powers while active, and users they promote are temporary moderators too.
