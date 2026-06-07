# WordWolf

WordWolf is a self-hostable multiplayer browser word game for local networks and intranets. It supports browser-based rooms, live chat, Socket.IO realtime state, local identity tokens, migration links for moving a player identity between devices, and moderator controls.

## Features

- Create generated rooms for up to 20 active seated players plus 200 inactive spectators/observers, or join existing rooms from room links.
- Local browser identity: a hidden random auth token is stored in localStorage with the one user-entered display name, so returning users are not repeatedly prompted for their name.
- Duplicate display names are allowed; stable room-scoped numbers are appended automatically as needed.
- Device migration links let a player use the same room identity on another device without exposing their real auth token.
- Creator/owner and moderator controls for starting/resetting games, settings, promotion/demotion, and observer management.
- Spectators and observers are intentionally distinct:
  - **Spectator**: no table seat; can later choose any free seat.
  - **Observer**: seated-but-inactive; previous seat remains reserved and they can be joined back by themself or a moderator.
- Works on HTTP or HTTPS and uses local assets only for intranet play.

## Self-hosting

See [`docs/self-hosting.md`](docs/self-hosting.md).

Quick start on a server with Node, pnpm, tmux, and Caddy:

```bash
./self_host.py setup
```

The default URL is `https://wordwolf.pinky.lilf.ir`. You can pass a URL explicitly:

```bash
./self_host.py setup http://wordwolf.lan
./self_host.py dev-start http://wordwolf.lan
./self_host.py stop
```

## Local development without Caddy

```bash
pnpm install
pnpm dev
```

Then open the local port printed by the server.
