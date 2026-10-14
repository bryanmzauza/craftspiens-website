#!/usr/bin/env bash
# Instala o backup diário dos bancos (local e Google Drive criptografado).
# Ver docs/arquitetura-producao.md, seção 12.
#
# Pré-requisito: o site instalado com o layout de releases (seção 11), com o .env em
# /opt/craftsapiens/shared/.env.
#
# Uso (com os outros arquivos desta pasta ao lado), num terminal interativo:
#   sudo bash instalar-backup.sh
#
# Pede, uma vez, o token do Google Drive (gerado no seu computador com o rclone) e mostra
# a senha da criptografia para você guardar. Pode ser rodado de novo: pula o que já existe.
set -euo pipefail

ENV_SITE=/opt/craftsapiens/shared/.env
CONF=/etc/craftsapiens/backup.conf
PASTA_DRIVE=craftsapiens-backups
HERE="$(cd "$(dirname "$0")" && pwd)"

etapa() { echo; echo "==> $*"; }
falha() { echo "ERRO: $*" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || falha "rode com sudo"
[ -t 0 ] || falha "rode num terminal interativo (ssh -t)"
for f in craftsapiens-backup.sh craftsapiens-backup.service craftsapiens-backup.timer; do
  [ -f "$HERE/$f" ] || falha "$f não encontrado em $HERE"
done
[ -f "$ENV_SITE" ] || falha "$ENV_SITE não encontrado"

# -----------------------------------------------------------------------------
etapa "rclone"
command -v rclone >/dev/null || apt-get install -y rclone
rclone version | head -1

# -----------------------------------------------------------------------------
etapa "Configuração ($CONF)"
if [ -f "$CONF" ]; then
  echo "já existe"
else
  # Usuário, banco e porta vêm do POSTGRES_URL do site; o container, da porta publicada
  read -r PG_USER PG_DB PG_PORT < <(ENV_SITE="$ENV_SITE" node -e '
    const l = require("node:fs").readFileSync(process.env.ENV_SITE, "utf8").split(/\r?\n/)
      .find((x) => /^POSTGRES_URL=/.test(x));
    const u = new URL(l.replace(/^POSTGRES_URL=/, "").replace(/^"|"$/g, ""));
    console.log(decodeURIComponent(u.username), u.pathname.slice(1), u.port || 5432);
  ')
  PG_CONTAINER=$(docker ps --format '{{.Names}} {{.Ports}}' | awk -v p=":$PG_PORT->" 'index($0, p) {print $1; exit}')
  [ -n "$PG_CONTAINER" ] || falha "nenhum container publica a porta $PG_PORT"

  if mountpoint -q /mnt/hdd; then
    DESTINO=/mnt/hdd/backups/craftsapiens
    MONTAGEM=/mnt/hdd
  else
    DESTINO=/var/backups/craftsapiens
    MONTAGEM=
  fi

  mkdir -p "$(dirname "$CONF")"
  (umask 077; cat >"$CONF" <<EOF
# Backup dos bancos do site (lido por /usr/local/bin/craftsapiens-backup.sh)
PG_CONTAINER=$PG_CONTAINER
PG_USER=$PG_USER
PG_DB=$PG_DB
DESTINO_LOCAL=$DESTINO
# Disco que precisa estar montado antes do backup (vazio para não conferir)
MONTAGEM=$MONTAGEM
REMOTO=gdrive-crypt:
ENV_SITE=$ENV_SITE
# Tabela nlogin do MariaDB (contas do jogo e do site)
NLOGIN=1
DIAS_LOCAL=14
DIAS_DRIVE=30
MESES_DRIVE=12
EOF
  )
  echo "PostgreSQL: container $PG_CONTAINER; backups locais em $DESTINO"
fi
# shellcheck source=/dev/null
. "$CONF"
mkdir -p "$DESTINO_LOCAL"
chmod 700 "$DESTINO_LOCAL"

# -----------------------------------------------------------------------------
etapa "Google Drive (remote gdrive)"
if rclone listremotes | grep -qx 'gdrive:' && ! rclone lsd gdrive: >/dev/null 2>&1; then
  echo "o remote gdrive existe, mas não acessa o Google Drive: será configurado de novo"
  rclone config delete gdrive
fi
if rclone listremotes | grep -qx 'gdrive:'; then
  echo "já configurado"
else
  cat <<'EOF'
No SEU computador (com navegador), num terminal:

  1. Instale o rclone (uma vez):  winget install Rclone.Rclone
     (feche e abra o terminal depois)
  2. Rode:

       rclone authorize "drive" "eyJzY29wZSI6ImRyaXZlLmZpbGUifQ"

  3. O navegador abre: entre na conta Google que vai guardar os backups e autorize.
     O acesso é só aos arquivos que o rclone criar (escopo drive.file).
  4. O terminal mostra um token entre as linhas "Paste the following into your
     remote machine --->" e "<---End paste". Copie tudo o que está entre elas
     (começa com { ou, nas versões mais novas do rclone, com eyJ).
EOF
  echo
  read -r -p "Cole o token aqui: " ENTRADA
  # Aceita o JSON do token ou a versão em base64 que o rclone mais novo imprime, e remove
  # o que o terminal acrescenta ao colar (sequências de "bracketed paste", quebras de linha)
  TOKEN=$(printf '%s' "$ENTRADA" | node -e '
    let s = require("node:fs").readFileSync(0, "utf8")
      .replace(/\x1b\[20[01]~/g, "").replace(/[\x00-\x1f\s]+/g, "");
    const ler = (x) => { try { return JSON.parse(x); } catch { return null; } };
    let o = ler(s) ?? ler(Buffer.from(s, "base64").toString("utf8"));
    if (o && typeof o.token === "string") o = ler(o.token);
    if (!o || !o.access_token || !o.refresh_token) {
      const tipo = o ? "JSON sem access_token/refresh_token (campos: " + Object.keys(o).join(", ") + ")"
        : "texto que não é JSON nem base64 de JSON (" + s.length + " caracteres, começa com \"" + s.slice(0, 3) + "\")";
      console.error("token inválido: " + tipo);
      process.exit(1);
    }
    process.stdout.write(JSON.stringify(o));
  ') || falha "cole a linha do token inteira, como o rclone mostrou"
  unset ENTRADA
  rclone config create gdrive drive scope=drive.file token="$TOKEN" --non-interactive >/dev/null
  unset TOKEN
  rclone lsd gdrive: >/dev/null || falha "não consegui acessar o Google Drive com esse token"
  echo "Google Drive: ok"
fi

# -----------------------------------------------------------------------------
etapa "Criptografia (remote gdrive-crypt)"
if rclone listremotes | grep -qx 'gdrive-crypt:'; then
  echo "já configurado"
else
  SENHA=$(openssl rand -base64 48 | tr -d '/+=\n' | cut -c1-40)
  SAL=$(openssl rand -base64 48 | tr -d '/+=\n' | cut -c1-40)
  rclone config create gdrive-crypt crypt remote="gdrive:$PASTA_DRIVE" \
    filename_encryption=standard directory_name_encryption=true \
    password="$SENHA" password2="$SAL" --obscure --non-interactive >/dev/null
  cat <<EOF

================================================================================
 GUARDE AGORA no gerenciador de senhas (sem isto os backups não podem ser lidos):

   Pasta no Google Drive:  $PASTA_DRIVE
   Senha (password):       $SENHA
   Sal (password2):        $SAL

 Para restaurar em outra máquina: rclone config, remote tipo "crypt" apontando
 para <remote do drive>:$PASTA_DRIVE, nomes criptografados (standard), com
 esta senha e este sal.
================================================================================

EOF
  unset SENHA SAL
  RESP=
  while [ "$RESP" != "SALVEI" ]; do
    read -r -p "Digite SALVEI depois de guardar a senha e o sal: " RESP
  done
  clear
fi
chmod 600 /root/.config/rclone/rclone.conf

# -----------------------------------------------------------------------------
etapa "Script, serviço e timer"
install -m 755 -o root -g root "$HERE/craftsapiens-backup.sh" /usr/local/bin/craftsapiens-backup.sh
install -m 644 -o root -g root "$HERE/craftsapiens-backup.service" /etc/systemd/system/craftsapiens-backup.service
install -m 644 -o root -g root "$HERE/craftsapiens-backup.timer" /etc/systemd/system/craftsapiens-backup.timer
bash -n /usr/local/bin/craftsapiens-backup.sh
systemctl daemon-reload
systemctl enable --now craftsapiens-backup.timer >/dev/null 2>&1

# -----------------------------------------------------------------------------
etapa "Primeiro backup"
systemctl start craftsapiens-backup.service || true
journalctl -u craftsapiens-backup -n 30 --no-pager -o cat --since "-10min" | grep -iE '\[backup\]|error|failed to'
systemctl is-failed --quiet craftsapiens-backup.service && falha "o primeiro backup falhou (ver acima)"

etapa "Teste de restauração"
/usr/local/bin/craftsapiens-backup.sh --testar | tail -3

echo
systemctl list-timers craftsapiens-backup.timer --no-pager | head -2
echo
echo "Pronto. Comandos úteis:"
echo "  journalctl -u craftsapiens-backup -n 30            resultado do último backup"
echo "  sudo systemctl start craftsapiens-backup.service   backup agora"
echo "  sudo craftsapiens-backup.sh --testar               testar a restauração"
echo "  sudo rclone lsl gdrive-crypt:diario/               backups no Google Drive"
