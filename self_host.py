#!/usr/bin/env python3
"""Self-host WordWolf with tmux and Caddy.

Usage:
  ./self_host.py setup [url]
  ./self_host.py redeploy [url]
  ./self_host.py start [url]
  ./self_host.py stop
  ./self_host.py dev-start [url]
"""

from __future__ import annotations

import argparse
import os
import shutil
import socket
import subprocess
import sys
from pathlib import Path
from urllib.parse import urlparse

APP = "wordwolf"
DEFAULT_URL = "https://wordwolf.pinky.lilf.ir"
ROOT = Path(__file__).resolve().parent
HOME = Path.home()
CADDYFILE = HOME / "Caddyfile"
MARK_START = "# BEGIN WORDWOLF SELF HOST"
MARK_END = "# END WORDWOLF SELF HOST"
PROD_SESSION = "wordwolf-prod"
DEV_SESSION = "wordwolf-dev"
BACKEND_PORT = int(os.environ.get("WORDWOLF_BACKEND_PORT", "3101"))
DEV_FRONTEND_PORT = int(os.environ.get("WORDWOLF_DEV_FRONTEND_PORT", "3100"))
PROXY_ENV_NAMES = [
    "ALL_PROXY", "all_proxy", "http_proxy", "https_proxy", "HTTP_PROXY", "HTTPS_PROXY",
    "npm_config_proxy", "npm_config_https_proxy",
]


def run(cmd: list[str], *, cwd: Path = ROOT, check: bool = True) -> subprocess.CompletedProcess:
    print("+", " ".join(cmd))
    return subprocess.run(cmd, cwd=cwd, check=check)


def capture(cmd: list[str], *, cwd: Path = ROOT) -> str:
    return subprocess.check_output(cmd, cwd=cwd, text=True).strip()


def require_tool(name: str) -> None:
    if not shutil.which(name):
        raise SystemExit(f"Missing required command: {name}")


def parse_url(url: str):
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc or parsed.path not in {"", "/"}:
        raise SystemExit("URL must look like http(s)://host with no path")
    return parsed


def port_in_use(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.settimeout(0.2)
        return sock.connect_ex(("127.0.0.1", port)) == 0


def ensure_port_free(port: int) -> None:
    if port_in_use(port):
        raise SystemExit(f"Port {port} is already in use. Stop that service or choose another WORDWOLF_*_PORT.")


def tmux_kill(session: str) -> None:
    subprocess.run(["tmux", "kill-session", "-t", session], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=False)


def tmuxnew(session: str, command: str, extra_env: dict[str, str] | None = None) -> None:
    # Equivalent to the requested helper:
    # tmux kill-session -t "$1" &> /dev/null || true; tmux new -d -s "$@"
    tmux_kill(session)
    cmd = ["tmux", "new", "-d", "-s", session]
    env = {name: os.environ[name] for name in PROXY_ENV_NAMES if os.environ.get(name)}
    env.update(extra_env or {})
    for key, value in env.items():
        cmd.extend(["-e", f"{key}={value}"])
    cmd.append(command)
    run(cmd)


def install() -> None:
    require_tool("pnpm")
    run(["pnpm", "install", "--frozen-lockfile", "--prefer-offline"])


def build_static() -> None:
    run(["pnpm", "run", "build"])


def caddy_block(url: str, mode: str) -> str:
    parsed = parse_url(url)
    host = parsed.netloc
    primary = f"{parsed.scheme}://{host}"
    reverse_scheme = "http" if parsed.scheme == "https" else "https"
    reverse = f"{reverse_scheme}://{host}"
    target = f"http://127.0.0.1:{BACKEND_PORT}"
    frontend = f"http://127.0.0.1:{DEV_FRONTEND_PORT}"

    if parsed.scheme == "https":
        redirect = f"{reverse} {{\n\tredir https://{{host}}{{uri}} permanent\n}}"
    else:
        redirect = f"{reverse} {{\n\tredir http://{{host}}{{uri}} permanent\n}}"

    if mode == "prod":
        body = f"""{primary} {{
\troot * {ROOT / 'out'}
\tencode gzip zstd
\t@backend path /socket.io/* /createLobby /joinLobby /messages/* /gameMessages/* /resolveMigration/* /migration/*
\treverse_proxy @backend {target}
\ttry_files {{path}} {{path}}/ /index.html
\tfile_server
}}"""
    else:
        body = f"""{primary} {{
\tencode gzip zstd
\t@backend path /socket.io/* /createLobby /joinLobby /messages/* /gameMessages/* /resolveMigration/* /migration/*
\treverse_proxy @backend {target}
\treverse_proxy {frontend}
}}"""

    return f"{MARK_START}\n{redirect}\n\n{body}\n{MARK_END}\n"


def write_caddy(url: str, mode: str) -> None:
    block = caddy_block(url, mode)
    current = CADDYFILE.read_text() if CADDYFILE.exists() else ""
    if MARK_START in current and MARK_END in current:
        before = current.split(MARK_START)[0].rstrip()
        after = current.split(MARK_END, 1)[1].lstrip()
        new_text = f"{before}\n\n{block}\n{after}" if before else f"{block}\n{after}"
    else:
        sep = "\n\n" if current.strip() else ""
        new_text = f"{current.rstrip()}{sep}{block}"
    CADDYFILE.write_text(new_text.rstrip() + "\n")
    if shutil.which("caddy"):
        run(["caddy", "fmt", "--overwrite", str(CADDYFILE)], cwd=HOME, check=False)
        run(["caddy", "reload", "--config", str(CADDYFILE)], cwd=HOME, check=False)
    else:
        print("caddy command not found; wrote ~/Caddyfile but did not reload it")


def stop() -> None:
    tmux_kill(PROD_SESSION)
    tmux_kill(DEV_SESSION)


def start(url: str) -> None:
    stop()
    ensure_port_free(BACKEND_PORT)
    write_caddy(url, "prod")
    tmuxnew(PROD_SESSION, f"cd {ROOT} && PORT={BACKEND_PORT} NODE_ENV=production pnpm start", {"PORT": str(BACKEND_PORT), "NODE_ENV": "production"})
    print(f"Started production WordWolf at {url}")


def dev_start(url: str) -> None:
    stop()
    ensure_port_free(BACKEND_PORT)
    ensure_port_free(DEV_FRONTEND_PORT)
    write_caddy(url, "dev")
    tmuxnew(DEV_SESSION, f"cd {ROOT} && PORT={DEV_FRONTEND_PORT} pnpm exec nodemon server/server.js", {"PORT": str(DEV_FRONTEND_PORT)})
    tmuxnew(PROD_SESSION, f"cd {ROOT} && PORT={BACKEND_PORT} NODE_ENV=production pnpm start", {"PORT": str(BACKEND_PORT), "NODE_ENV": "production"})
    print(f"Started dev WordWolf at {url}")


def setup(url: str) -> None:
    stop()
    install()
    build_static()
    start(url)


def redeploy(url: str) -> None:
    stop()
    install()
    build_static()
    start(url)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=["setup", "redeploy", "start", "stop", "dev-start"])
    parser.add_argument("url", nargs="?", default=os.environ.get("WORDWOLF_URL", DEFAULT_URL))
    args = parser.parse_args()

    require_tool("tmux")
    parse_url(args.url)

    if args.command == "stop":
      stop()
    elif args.command == "setup":
      setup(args.url)
    elif args.command == "redeploy":
      redeploy(args.url)
    elif args.command == "start":
      start(args.url)
    elif args.command == "dev-start":
      dev_start(args.url)


if __name__ == "__main__":
    main()
