#!/usr/bin/env bash
# Deploy automático do site: publica o último commit da branch main.
#
# Roda como o usuário craftsapiens, a cada 5 minutos (craftsapiens-deploy.timer).
# O servidor puxa o código; nada no GitHub tem acesso ao servidor.
# Instalação: scripts/servidor/instalar-deploy.sh. Detalhes: docs/arquitetura-producao.md, seção 11.
#
# Uso:
#   craftsapiens-deploy.sh                verifica a main e publica se houver commit novo
#   craftsapiens-deploy.sh --forcar       tenta de novo um commit que falhou
#   craftsapiens-deploy.sh --com-schema   publica um commit que altera prisma/schema.pg.prisma
#                                         (roda db:push:pg antes de ativar; faça backup antes)
#   craftsapiens-deploy.sh --voltar       volta para a versão anterior
#
# Layout em /opt/craftsapiens:
#   repo/                   clone do repositório (só fetch)
#   releases/<sha>/         cada versão compilada
#   site -> releases/<sha>  versão no ar (link simbólico; o serviço roda aqui)
#   shared/.env             variáveis de ambiente (link em cada release)
#   shared/next-cache/      cache do next build, compartilhado entre as versões
#   deploy/                 estado (anterior, falhou, bloqueado), trava e logs dos builds
#   deploy.conf             EMAIL_AVISO e, se preciso, BRANCH e URL
#   allowed_signers         se existir, só commits assinados por essas chaves são publicados
set -euo pipefail

BASE=/opt/craftsapiens
REPO=$BASE/repo
RELEASES=$BASE/releases
SITE=$BASE/site
SHARED=$BASE/shared
ESTADO=$BASE/deploy
NOTIFICAR=/usr/local/lib/craftsapiens/notificar-deploy.mjs
SERVICO=craftsapiens-site.service
BRANCH=main
URL=http://10.20.0.2:3000   # onde o Next.js ouve (IP do túnel)
MANTER=3                    # versões guardadas para rollback

if [ -f "$BASE/deploy.conf" ]; then
  set -a
  # shellcheck source=/dev/null
  . "$BASE/deploy.conf"
  set +a
fi

MODO=auto
case "${1:-}" in
  "") ;;
  --forcar) MODO=forcar ;;
  --com-schema) MODO=schema ;;
  --voltar) MODO=voltar ;;
  *) echo "uso: $0 [--forcar|--com-schema|--voltar]" >&2; exit 2 ;;
esac

log() { echo "[deploy] $*"; }
curto() { echo "${1:0:7}"; }
atual() { basename "$(readlink -f "$SITE")"; }
resumo() { git -C "$REPO" log -1 --format='%h %s (%an, %ad)' --date=format:'%d/%m/%Y %H:%M' "$1"; }

avisar() { # assunto, corpo, [arquivo de log]
  [ -f "$NOTIFICAR" ] || return 0
  SITE_DIR="$SITE" node "$NOTIFICAR" "$1" "$2" "${3:-}" || log "aviso por e-mail falhou"
}

# Só um deploy por vez
mkdir -p "$ESTADO/log"
exec 9>"$ESTADO/lock"
flock -n 9 || { log "outro deploy em andamento"; exit 0; }

# O site precisa responder a página inicial e uma consulta ao banco
saudavel() {
  local i
  for i in $(seq 1 45); do
    if curl -sf -o /dev/null --max-time 5 -H 'X-Real-IP: 127.0.0.1' "$URL/" \
      && curl -sf -o /dev/null --max-time 10 -H 'X-Real-IP: 127.0.0.1' "$URL/api/estatisticas"; then
      return 0
    fi
    sleep 2
  done
  return 1
}

# Troca o link simbólico de forma atômica e reinicia o serviço
ativar() {
  ln -sfn "$1" "$SITE.novo"
  mv -T "$SITE.novo" "$SITE"
  sudo -n systemctl restart "$SERVICO"
}

# -----------------------------------------------------------------------------
if [ "$MODO" = voltar ]; then
  ANTERIOR=$(cat "$ESTADO/anterior" 2>/dev/null || true)
  if [ -z "$ANTERIOR" ] || [ ! -d "$RELEASES/$ANTERIOR" ]; then
    log "não há versão anterior guardada"
    exit 1
  fi
  DE=$(atual)
  log "voltando de $(curto "$DE") para $(curto "$ANTERIOR")"
  ativar "$RELEASES/$ANTERIOR"
  echo "$DE" >"$ESTADO/anterior"
  if saudavel; then
    log "no ar: $(curto "$ANTERIOR")"
    avisar "Site: voltou para a versão $(curto "$ANTERIOR")" "Rollback manual.

No ar: $(resumo "$ANTERIOR")
Antes:  $(resumo "$DE")"
    exit 0
  fi
  log "a versão anterior também não respondeu: verifique o site"
  exit 1
fi

# -----------------------------------------------------------------------------
git -C "$REPO" fetch --quiet origin "$BRANCH"
NOVO=$(git -C "$REPO" rev-parse "origin/$BRANCH")
ATUAL=$(atual)

# Nada novo: sai em silêncio (roda a cada 5 minutos)
[ "$NOVO" != "$ATUAL" ] || exit 0

if [ "$MODO" = auto ]; then
  for marca in falhou bloqueado; do
    if [ "$(cat "$ESTADO/$marca" 2>/dev/null || true)" = "$NOVO" ]; then
      exit 0 # já tentou e já avisou; espera um commit novo ou --forcar/--com-schema
    fi
  done
fi

if ! git -C "$REPO" cat-file -e "$ATUAL^{commit}" 2>/dev/null; then
  log "a versão no ar ($ATUAL) não é um commit conhecido; corrija o link $SITE"
  exit 1
fi

log "commit novo: $(resumo "$NOVO")"

falhar() { # motivo, [arquivo de log]
  echo "$NOVO" >"$ESTADO/falhou"
  log "FALHA: $1"
  avisar "Site: deploy de $(curto "$NOVO") falhou" "$1

Commit: $(resumo "$NOVO")
No ar:  $(resumo "$(atual)")

Para tentar de novo: sudo -u craftsapiens craftsapiens-deploy.sh --forcar" "${2:-}"
  exit 1
}

# Assinatura (opcional): exige o arquivo de chaves autorizadas
if [ -f "$BASE/allowed_signers" ]; then
  if ! git -C "$REPO" -c gpg.ssh.allowedSignersFile="$BASE/allowed_signers" verify-commit "$NOVO" >/dev/null 2>&1; then
    falhar "o commit não tem assinatura válida de uma chave autorizada ($BASE/allowed_signers)"
  fi
fi

# Mudança no banco: o db:push pode apagar colunas com dados, então só com --com-schema
if ! git -C "$REPO" diff --quiet "$ATUAL" "$NOVO" -- prisma/schema.pg.prisma; then
  if [ "$MODO" != schema ]; then
    echo "$NOVO" >"$ESTADO/bloqueado"
    log "prisma/schema.pg.prisma mudou: deploy bloqueado até ser feito à mão"
    avisar "Site: deploy bloqueado (mudança no banco)" "O commit altera prisma/schema.pg.prisma e não foi publicado.

Commit: $(resumo "$NOVO")
No ar:  $(resumo "$ATUAL")

Para publicar, no servidor físico:
  1. backup do PostgreSQL (sudo systemctl start craftsapiens-backup.service)
  2. sudo -u craftsapiens craftsapiens-deploy.sh --com-schema"
    exit 0
  fi
fi

# -----------------------------------------------------------------------------
DIR=$RELEASES/$NOVO
LOG=$ESTADO/log/$(date +%Y%m%d-%H%M%S)-$(curto "$NOVO").log

rm -rf "$DIR"
mkdir -p "$DIR" "$SHARED/next-cache"
git -C "$REPO" archive "$NOVO" | tar -x -C "$DIR"
ln -s "$SHARED/.env" "$DIR/.env"
mkdir -p "$DIR/.next"
ln -s "$SHARED/next-cache" "$DIR/.next/cache"

log "instalando dependências (log: $LOG)"
(cd "$DIR" && npm ci --no-audit --no-fund) >>"$LOG" 2>&1 || falhar "npm ci falhou" "$LOG"

log "compilando"
(cd "$DIR" && npm run build) >>"$LOG" 2>&1 || falhar "npm run build falhou" "$LOG"

if [ "$MODO" = schema ]; then
  log "aplicando o schema no PostgreSQL"
  (cd "$DIR" && npm run db:push:pg) >>"$LOG" 2>&1 || falhar "db:push:pg falhou" "$LOG"
fi

log "ativando $(curto "$NOVO")"
ativar "$DIR"

if saudavel; then
  echo "$ATUAL" >"$ESTADO/anterior"
  rm -f "$ESTADO/falhou" "$ESTADO/bloqueado"
  log "no ar: $(curto "$NOVO")"

  # Guarda só as versões mais recentes (nunca a atual nem a anterior)
  ls -1dt "$RELEASES"/*/ | tail -n +$((MANTER + 1)) | while read -r dir; do
    sha=$(basename "$dir")
    [ "$sha" = "$NOVO" ] || [ "$sha" = "$ATUAL" ] || rm -rf "$dir"
  done
  find "$ESTADO/log" -name '*.log' -mtime +30 -delete

  avisar "Site atualizado: $(curto "$NOVO")" "No ar:  $(resumo "$NOVO")
Antes:  $(resumo "$ATUAL")

Para voltar: sudo -u craftsapiens craftsapiens-deploy.sh --voltar"
  exit 0
fi

log "a versão nova não respondeu; voltando para $(curto "$ATUAL")"
ativar "$RELEASES/$ATUAL"
if saudavel; then
  falhar "a versão nova não respondeu ao teste; a anterior voltou ao ar" "$LOG"
fi
falhar "a versão nova não respondeu e a anterior também não: VERIFIQUE O SITE" "$LOG"
