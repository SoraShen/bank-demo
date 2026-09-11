#!/usr/bin/env python3
"""Deploy standard-bank-demo to ECS + standard-bank-demo.alexsora.xyz."""

from __future__ import annotations

import os
import tarfile
from io import BytesIO
from pathlib import Path

import paramiko

ROOT = Path(__file__).resolve().parents[1]
ENV_CANDIDATES = [
    Path("/Users/shenbinchang/Documents/VDC/token plan/.env.local"),
    ROOT.parent / "token plan" / ".env.local",
]
REMOTE_DIR = "/opt/standard-bank-demo"
APP_PORT = os.environ.get("SB_DEMO_PORT", "3044")
APP_NAME = "standard-bank-demo"
HOST = "standard-bank-demo.alexsora.xyz"
EXCLUDE_DIRS = {".git", "node_modules", ".next", ".tmp", ".agents", ".cursor"}
EXCLUDE_FILES = {".DS_Store"}
EXCLUDE_PREFIXES = (".env",)


def load_ecs_env() -> dict:
    data = {}
    for path in ENV_CANDIDATES:
        if not path.exists():
            continue
        for line in path.read_text().splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            data[k.strip()] = v.strip().strip('"').strip("'")
        break
    host = os.environ.get("ECS_HOST") or data.get("ECS_HOST") or "182.160.16.138"
    user = os.environ.get("ECS_USER") or data.get("ECS_USER") or "root"
    password = os.environ.get("ECS_PASSWORD") or data.get("ECS_PASSWORD")
    if not password:
        raise SystemExit("Need ECS_PASSWORD")
    return {"host": host, "user": user, "password": password}


def make_tarball() -> bytes:
    buf = BytesIO()
    with tarfile.open(fileobj=buf, mode="w:gz") as tar:
        for path in ROOT.rglob("*"):
            if not path.is_file():
                continue
            rel = path.relative_to(ROOT)
            if any(part in EXCLUDE_DIRS for part in rel.parts):
                continue
            if path.name in EXCLUDE_FILES or path.name.startswith(EXCLUDE_PREFIXES):
                continue
            tar.add(path, arcname=str(rel))
    return buf.getvalue()


def run(ssh: paramiko.SSHClient, cmd: str, check: bool = True, timeout: int = 900) -> str:
    print(f"$ {cmd[:180]}")
    stdin, stdout, stderr = ssh.exec_command(cmd, get_pty=True, timeout=timeout)
    out = stdout.read().decode("utf-8", errors="replace")
    code = stdout.channel.recv_exit_status()
    if out.strip():
        print(out.strip()[-4000:])
    if check and code != 0:
        raise RuntimeError(f"failed ({code}): {cmd}")
    return out


def connect() -> tuple[paramiko.SSHClient, paramiko.SFTPClient]:
    cfg = load_ecs_env()
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(
        cfg["host"],
        username=cfg["user"],
        password=cfg["password"],
        timeout=30,
        allow_agent=False,
        look_for_keys=False,
    )
    return ssh, ssh.open_sftp()


def probe() -> None:
    ssh, sftp = connect()
    try:
        print("=== listening ports ===")
        run(ssh, "ss -tlnp | awk '{print $4}' | sed 's/.*://' | sort -n | uniq", check=False)
        print("=== nginx conf.d ===")
        run(ssh, "ls /etc/nginx/conf.d/", check=False)
        print("=== systemd units ===")
        run(ssh, "ls /etc/systemd/system/*.service | xargs -n1 basename | grep -E 'demo|bank|telkom|acsa|prasa' || true", check=False)
        print("=== existing app? ===")
        run(ssh, f"test -d {REMOTE_DIR} && echo exists || echo missing; test -f /etc/letsencrypt/live/{HOST}/fullchain.pem && echo cert_ok || echo no_cert", check=False)
    finally:
        sftp.close()
        ssh.close()


def main() -> None:
    cfg = load_ecs_env()
    print(f"Deploying to {cfg['user']}@{cfg['host']}:{REMOTE_DIR} port {APP_PORT}")
    ssh, sftp = connect()

    tarball = make_tarball()
    remote_tar = "/tmp/standard-bank-demo.tar.gz"
    with sftp.file(remote_tar, "wb") as f:
        f.write(tarball)
    print(f"Uploaded app archive ({len(tarball)} bytes)")
    run(ssh, f"mkdir -p {REMOTE_DIR} && tar -xzf {remote_tar} -C {REMOTE_DIR} && rm -f {remote_tar}")

    local_env = ROOT / ".env.local"
    if local_env.exists():
        sftp.put(str(local_env), f"{REMOTE_DIR}/.env.local")
        print("Uploaded .env.local")

    unit = f"""[Unit]
Description={APP_NAME}
After=network.target

[Service]
Type=simple
WorkingDirectory={REMOTE_DIR}
Environment=NODE_ENV=production
Environment=PORT={APP_PORT}
Environment=HOSTNAME=127.0.0.1
EnvironmentFile=-{REMOTE_DIR}/.env.local
ExecStart=/usr/bin/npm run start -- -H 127.0.0.1 -p {APP_PORT}
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
"""
    with sftp.file(f"/etc/systemd/system/{APP_NAME}.service", "w") as f:
        f.write(unit)

    run(
        ssh,
        f"""
set -euo pipefail
cd {REMOTE_DIR}
export PATH=/usr/local/bin:/usr/bin:$PATH
if ! command -v node >/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
npm ci
npm run build
systemctl daemon-reload
systemctl enable {APP_NAME}
systemctl restart {APP_NAME}
sleep 3
systemctl --no-pager --full status {APP_NAME} | head -24
curl -sS -o /dev/null -w '%{{http_code}}\\n' http://127.0.0.1:{APP_PORT}/
""",
        timeout=900,
    )

    run(ssh, f"mkdir -p /var/www/{HOST}")

    http_only = f"""server {{
  listen 80;
  listen [::]:80;
  server_name {HOST};

  location ^~ /.well-known/acme-challenge/ {{
    root /var/www/{HOST};
    default_type "text/plain";
    try_files $uri =404;
  }}

  location / {{
    proxy_pass http://127.0.0.1:{APP_PORT};
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 120s;
  }}
}}
"""
    with sftp.file(f"/etc/nginx/conf.d/{HOST}.conf", "w") as f:
        f.write(http_only)
    run(ssh, "nginx -t && systemctl reload nginx")

    run(
        ssh,
        f"certbot certonly --webroot -w /var/www/{HOST} -d {HOST} --non-interactive --agree-tos --register-unsafely-without-email",
        check=False,
        timeout=180,
    )

    https_app = f"""server {{
  listen 80;
  listen [::]:80;
  server_name {HOST};

  location ^~ /.well-known/acme-challenge/ {{
    root /var/www/{HOST};
    default_type "text/plain";
    try_files $uri =404;
  }}

  location / {{
    return 301 https://$host$request_uri;
  }}
}}

server {{
  listen 443 ssl;
  listen [::]:443 ssl;
  server_name {HOST};

  ssl_certificate     /etc/letsencrypt/live/{HOST}/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/{HOST}/privkey.pem;
  ssl_protocols       TLSv1.2 TLSv1.3;

  client_max_body_size 20m;

  location / {{
    proxy_pass http://127.0.0.1:{APP_PORT};
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 120s;
  }}
}}
"""
    cert_ls = run(ssh, f"ls /etc/letsencrypt/live/{HOST}/fullchain.pem", check=False)
    if "fullchain.pem" in cert_ls:
        with sftp.file(f"/etc/nginx/conf.d/{HOST}.conf", "w") as f:
            f.write(https_app)
        run(ssh, "nginx -t && systemctl reload nginx")
    else:
        print("WARN: LE cert missing; left HTTP-only vhost for ACME retry")

    print("Local origin verify:")
    run(ssh, f"curl -skS -o /dev/null -w '%{{http_code}}\\n' -H 'Host: {HOST}' https://127.0.0.1/", check=False)
    run(ssh, f"curl -sS -o /dev/null -w '%{{http_code}}\\n' -H 'Host: {HOST}' http://127.0.0.1/", check=False)
    sftp.close()
    ssh.close()
    print(f"ECS path {REMOTE_DIR}")
    print(f"Public https://{HOST}")
    print(f"systemd {APP_NAME}.service")


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "probe":
        probe()
    else:
        main()
