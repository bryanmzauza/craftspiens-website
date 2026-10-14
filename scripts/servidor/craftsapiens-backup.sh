#!/usr/bin/env bash
# Backup diário dos bancos do site: cópia local e cópia criptografada no Google Drive.
#
# Roda como root (docker exec), uma vez por dia (craftsapiens-backup.timer).
# Instalação: scripts/servidor/instalar-backup.sh. Detalhes: docs/arquitetura-producao.md, seção 12.
#
# O que guarda:
#   postgres_<data>.dump    PostgreSQL do site inteiro (pg_dump -Fc, restaurável com pg_restore)
#   nlogin_<data>.sql.gz    tabela nlogin do MariaDB (contas e senhas do jogo e do site)
#
# Retenção:
#   local                   DIAS_LOCAL dias (padrão 14)
#   Google Drive diario/    DIAS_DRIVE dias (padrão 30)
#   Google Drive mensal/    um backup por mês, por MESES_DRIVE meses (padrão 12)
#
# Uso:
#   craftsapiens-backup.sh            faz o backup
#   craftsapiens-backup.sh --testar   restaura o último backup local do PostgreSQL num banco
#                                     temporário, confere as tabelas e apaga o banco temporário
#
# Configuração em /etc/craftsapiens/backup.conf (criada pelo instalador):
#   PG_CONTAINER, PG_USER, PG_DB    container e banco do PostgreSQL
#   DESTINO_LOCAL                   pasta dos backups locais
#   MONTAGEM                        se definido, o disco que precisa estar montado
#   REMOTO                          remote do rclone (padrão gdrive-crypt:)
#   ENV_SITE                        .env do site, de onde vem o DATABASE_URL do nlogin
#   NLOGIN                          1 para incluir a tabela nlogin (padrão 1)
set -Eeuo pipefail
umask 077

CONF=/etc/craftsapiens/backup.conf
NOTIFICAR=/usr/local/lib/craftsapiens/notificar-deploy.mjs

[ "$(id -u)" -eq 0 ] || { echo "rode como root" >&2; exit 1; }
[ -f "$CONF" ] || { echo "$CONF não encontrado" >&2; exit 1; }
# shellcheck source=/dev/null
. "$CONF"

: "${PG_CONTAINER:?defina PG_CONTAINER em $CONF}"
: "${PG_USER:?defina PG_USER em $CONF}"
: "${PG_DB:?defina PG_DB em $CONF}"
: "${DESTINO_LOCAL:?defina DESTINO_LOCAL em $CONF}"
REMOTO=${REMOTO:-gdrive-crypt:}
ENV_SITE=${ENV_SITE:-/opt/craftsapiens/shared/.env}
NLOGIN=${NLOGIN:-1}
DIAS_LOCAL=${DIAS_LOCAL:-14}
DIAS_DRIVE=${DIAS_DRIVE:-30}
MESES_DRIVE=${MESES_DRIVE:-12}

log() { echo "[backup] $*"; }

# -----------------------------------------------------------------------------
if [ "${1:-}" = "--testar" ]; then
  ULTIMO=$(ls -1t "$DESTINO_LOCAL"/diario/postgres_*.dump 2>/dev/null | head -1 || true)
  [ -n "$ULTIMO" ] || { log "nenhum backup local encontrado"; exit 1; }
  TESTE=restore_teste_$$
  log "restaurando $(basename "$ULTIMO") no banco temporário $TESTE"
  docker exec "$PG_CONTAINER" createdb -U "$PG_USER" "$TESTE"
  trap 'docker exec "$PG_CONTAINER" dropdb -U "$PG_USER" --if-exists "$TESTE"' EXIT
  docker exec -i "$PG_CONTAINER" pg_restore -U "$PG_USER" -d "$TESTE" --no-owner --exit-on-error <"$ULTIMO"
  TABELAS=$(docker exec "$PG_CONTAINER" psql -U "$PG_USER" -d "$TESTE" -At -c \
    "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'")
  USUARIOS=$(docker exec "$PG_CONTAINER" psql -U "$PG_USER" -d "$TESTE" -At -c \
    "SELECT count(*) FROM users" 2>/dev/null || echo "?")
  log "restauração ok: $TABELAS tabelas, $USUARIOS usuários"
  exit 0
fi

# -----------------------------------------------------------------------------
LOG=$(mktemp)
exec > >(tee -a "$LOG") 2>&1

falhou() {
  local linha=$1
  log "FALHA na linha $linha"
  if [ -f "$NOTIFICAR" ]; then
    SITE_DIR=/opt/craftsapiens/site node "$NOTIFICAR" "Backup do banco falhou" \
      "O backup diário falhou na linha $linha de $0.

Ver: journalctl -u craftsapiens-backup -n 80" "$LOG" || true
  fi
}
trap 'falhou $LINENO' ERR
trap 'rm -f "$LOG" "${OPCOES:-}"; rm -f "$DESTINO_LOCAL"/diario/*.parcial 2>/dev/null || true' EXIT

# Sem o disco montado, a pasta ficaria no disco do sistema (o fstab usa nofail)
if [ -n "${MONTAGEM:-}" ] && ! mountpoint -q "$MONTAGEM"; then
  log "$MONTAGEM não está montado"
  false
fi

STAMP=$(date +%Y-%m-%d_%H%M)
DIARIO=$DESTINO_LOCAL/diario
mkdir -p "$DIARIO"
ARQUIVOS=()

# -----------------------------------------------------------------------------
log "PostgreSQL ($PG_DB)"
PG_FILE=$DIARIO/postgres_$STAMP.dump
docker exec "$PG_CONTAINER" pg_dump -U "$PG_USER" -d "$PG_DB" -Fc >"$PG_FILE.parcial"
test -s "$PG_FILE.parcial"
# O arquivo precisa ser legível pelo pg_restore
docker exec -i "$PG_CONTAINER" pg_restore -l <"$PG_FILE.parcial" >/dev/null
mv "$PG_FILE.parcial" "$PG_FILE"
ARQUIVOS+=("$PG_FILE")

# -----------------------------------------------------------------------------
if [ "$NLOGIN" = 1 ]; then
  log "MariaDB (tabela nlogin)"
  OPCOES=$(mktemp)
  # Credenciais do DATABASE_URL do site num arquivo de opções temporário (não aparecem no ps)
  BANCO_NLOGIN=$(ENV_SITE="$ENV_SITE" OPCOES="$OPCOES" node -e '
    const fs = require("node:fs");
    const linha = fs.readFileSync(process.env.ENV_SITE, "utf8").split(/\r?\n/)
      .find((l) => /^DATABASE_URL=/.test(l));
    if (!linha) { console.error("DATABASE_URL não encontrado"); process.exit(1); }
    const u = new URL(linha.replace(/^DATABASE_URL=/, "").replace(/^"|"$/g, ""));
    const q = (s) => "\"" + decodeURIComponent(s).replace(/\\/g, "\\\\").replace(/"/g, "\\\"") + "\"";
    // O cliente do MariaDB exige TLS por padrão; na própria máquina a conexão não passa pela rede
    const local = ["127.0.0.1", "localhost", "[::1]"].includes(u.hostname);
    fs.writeFileSync(process.env.OPCOES,
      `[client]\nuser=${q(u.username)}\npassword=${q(u.password)}\nhost=${u.hostname}\nport=${u.port || 3306}\n` +
      (local ? "skip-ssl\n" : ""));
    console.log(decodeURIComponent(u.pathname.slice(1)));
  ')
  NL_FILE=$DIARIO/nlogin_$STAMP.sql.gz
  mariadb-dump --defaults-extra-file="$OPCOES" --single-transaction --quick --skip-lock-tables \
    --no-tablespaces "$BANCO_NLOGIN" nlogin | gzip -9 >"$NL_FILE.parcial"
  rm -f "$OPCOES"
  gzip -t "$NL_FILE.parcial"
  zgrep -q "CREATE TABLE" "$NL_FILE.parcial"
  mv "$NL_FILE.parcial" "$NL_FILE"
  ARQUIVOS+=("$NL_FILE")
fi

# -----------------------------------------------------------------------------
log "enviando para o Google Drive"
for f in "${ARQUIVOS[@]}"; do
  rclone copy --quiet "$f" "$REMOTO/diario/"
done

# Um backup por mês na pasta mensal (o primeiro backup bem-sucedido do mês)
MES=$(date +%Y-%m)
if [ -z "$(rclone lsf "$REMOTO/mensal/" --include "postgres_${MES}-*" 2>/dev/null)" ]; then
  log "cópia mensal de $MES"
  for f in "${ARQUIVOS[@]}"; do
    rclone copy --quiet "$f" "$REMOTO/mensal/"
  done
fi

# -----------------------------------------------------------------------------
log "removendo backups antigos"
find "$DIARIO" -type f \( -name 'postgres_*.dump' -o -name 'nlogin_*.sql.gz' \) -mtime +"$DIAS_LOCAL" -delete
rclone delete --quiet "$REMOTO/diario/" --min-age "${DIAS_DRIVE}d"
rclone delete --quiet "$REMOTO/mensal/" --min-age "$((MESES_DRIVE * 31))d"

for f in "${ARQUIVOS[@]}"; do
  log "ok: $(basename "$f") ($(du -h "$f" | cut -f1))"
done
log "locais: $(find "$DIARIO" -type f | wc -l) arquivos; Drive: $(rclone lsf "$REMOTO/diario/" | wc -l) diários, $(rclone lsf "$REMOTO/mensal/" | wc -l) mensais"
