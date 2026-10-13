#!/usr/bin/env bash
# Instala o deploy automático no servidor físico e migra o site para o layout de releases.
# Ver docs/arquitetura-producao.md, seção 11.
#
# Pré-requisito: o site instalado em /opt/craftsapiens/site (clone do repositório, com .env)
# e o serviço craftsapiens-site funcionando, conforme a seção 6.
#
# Uso (com os outros arquivos desta pasta ao lado):
#   sudo bash instalar-deploy.sh
#
# Pode ser rodado de novo: cada etapa pula o que já estiver feito.
set -euo pipefail

BASE=/opt/craftsapiens
APP_USER=craftsapiens
SITE=$BASE/site
REPO_URL=${REPO_URL:-https://github.com/bryanmzauza/craftspiens-website.git}
HERE="$(cd "$(dirname "$0")" && pwd)"

etapa() { echo; echo "==> $*"; }
falha() { echo "ERRO: $*" >&2; exit 1; }
como_app() { sudo -u "$APP_USER" -H "$@"; }

[ "$(id -u)" -eq 0 ] || falha "rode com sudo"
for f in craftsapiens-deploy.sh notificar-deploy.mjs craftsapiens-deploy.service craftsapiens-deploy.timer; do
  [ -f "$HERE/$f" ] || falha "$f não encontrado em $HERE"
done
id "$APP_USER" >/dev/null 2>&1 || falha "usuário $APP_USER não existe (instale o site antes, seção 6)"
systemctl is-active --quiet craftsapiens-site || falha "o serviço craftsapiens-site não está ativo"

# -----------------------------------------------------------------------------
etapa "Layout de releases"
if [ -L "$SITE" ]; then
  echo "já migrado: $SITE -> $(readlink "$SITE")"
else
  [ -d "$SITE/.git" ] || falha "$SITE não é um clone do repositório"
  SHA=$(como_app git -C "$SITE" rev-parse HEAD)
  mkdir -p "$BASE/releases" "$BASE/shared/next-cache" "$BASE/deploy/log"

  # O processo em execução continua funcionando: a pasta só muda de nome
  mv "$SITE" "$BASE/releases/$SHA"
  if [ ! -L "$BASE/releases/$SHA/.env" ]; then
    mv "$BASE/releases/$SHA/.env" "$BASE/shared/.env"
    ln -s "$BASE/shared/.env" "$BASE/releases/$SHA/.env"
  fi
  if [ -d "$BASE/releases/$SHA/.next/cache" ] && [ ! -L "$BASE/releases/$SHA/.next/cache" ]; then
    cp -a "$BASE/releases/$SHA/.next/cache/." "$BASE/shared/next-cache/"
    rm -rf "$BASE/releases/$SHA/.next/cache"
    ln -s "$BASE/shared/next-cache" "$BASE/releases/$SHA/.next/cache"
  fi
  ln -s "$BASE/releases/$SHA" "$SITE"
  chown -R "$APP_USER:" "$BASE/releases" "$BASE/shared" "$BASE/deploy"
  chown -h "$APP_USER:" "$SITE"
  chmod 600 "$BASE/shared/.env"
  echo "versão no ar: $SHA"
fi

# -----------------------------------------------------------------------------
etapa "Clone para o fetch"
if [ -d "$BASE/repo/.git" ]; then
  echo "já existe"
else
  como_app git clone --quiet --no-checkout "$REPO_URL" "$BASE/repo"
fi
como_app git -C "$BASE/repo" fetch --quiet origin main
echo "main remota: $(como_app git -C "$BASE/repo" rev-parse --short origin/main)"

# -----------------------------------------------------------------------------
etapa "Scripts (dono root: um commit não consegue alterá-los)"
install -m 755 -o root -g root "$HERE/craftsapiens-deploy.sh" /usr/local/bin/craftsapiens-deploy.sh
mkdir -p /usr/local/lib/craftsapiens
install -m 644 -o root -g root "$HERE/notificar-deploy.mjs" /usr/local/lib/craftsapiens/notificar-deploy.mjs
bash -n /usr/local/bin/craftsapiens-deploy.sh

# -----------------------------------------------------------------------------
etapa "Configuração ($BASE/deploy.conf)"
if [ -f "$BASE/deploy.conf" ]; then
  echo "já existe"
else
  INBOX=$(grep -E '^CONTACT_INBOX=' "$BASE/shared/.env" | head -1 | sed -E 's/^CONTACT_INBOX="?([^"]*)"?$/\1/' || true)
  cat >"$BASE/deploy.conf" <<EOF
# Configuração do deploy automático (lida por /usr/local/bin/craftsapiens-deploy.sh)
# Quem recebe os avisos de deploy (sucesso, falha e bloqueio)
EMAIL_AVISO=${INBOX}
EOF
  chown "$APP_USER:" "$BASE/deploy.conf"
  chmod 640 "$BASE/deploy.conf"
  echo "avisos para: ${INBOX:-(vazio: defina EMAIL_AVISO)}"
fi

# -----------------------------------------------------------------------------
etapa "sudo só para reiniciar o site"
cat >/etc/sudoers.d/craftsapiens-deploy <<'EOF'
# O deploy automático roda como craftsapiens e só pode reiniciar o serviço do site
craftsapiens ALL=(root) NOPASSWD: /usr/bin/systemctl restart craftsapiens-site.service
EOF
chmod 440 /etc/sudoers.d/craftsapiens-deploy
visudo -cf /etc/sudoers.d/craftsapiens-deploy >/dev/null
como_app sudo -n systemctl restart craftsapiens-site.service && echo "reinício pelo craftsapiens: ok"

# -----------------------------------------------------------------------------
etapa "Serviço e timer"
install -m 644 -o root -g root "$HERE/craftsapiens-deploy.service" /etc/systemd/system/craftsapiens-deploy.service
install -m 644 -o root -g root "$HERE/craftsapiens-deploy.timer" /etc/systemd/system/craftsapiens-deploy.timer
systemctl daemon-reload
systemctl enable --now craftsapiens-deploy.timer >/dev/null 2>&1

# -----------------------------------------------------------------------------
etapa "Conferindo o site no novo caminho"
for _ in $(seq 1 30); do
  curl -sf -o /dev/null --max-time 3 -H 'X-Real-IP: 127.0.0.1' http://10.20.0.2:3000/ && break
  sleep 2
done
echo "site: $(curl -s -o /dev/null -w '%{http_code}' --max-time 10 -H 'X-Real-IP: 127.0.0.1' http://10.20.0.2:3000/)"

etapa "Primeira verificação da main"
systemctl start craftsapiens-deploy.service
journalctl -u craftsapiens-deploy -n 5 --no-pager -o cat
systemctl list-timers craftsapiens-deploy.timer --no-pager | head -2

echo
echo "Pronto. Comandos úteis:"
echo "  journalctl -u craftsapiens-deploy -f                       acompanhar os deploys"
echo "  sudo -u craftsapiens craftsapiens-deploy.sh --voltar       voltar à versão anterior"
echo "  sudo -u craftsapiens craftsapiens-deploy.sh --com-schema   publicar mudança no banco (backup antes)"
