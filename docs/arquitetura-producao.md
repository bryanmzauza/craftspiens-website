# Arquitetura de Produção

> Propósito: descrever onde cada parte do site roda em produção, como as máquinas se comunicam e o passo a passo para instalar, atualizar, fazer backup e recuperar o ambiente.

---

## 1. Visão geral

O site roda em uma VPS dedicada. Os bancos de dados ficam no servidor físico, junto com os servidores de Minecraft. As duas máquinas conversam por um túnel WireGuard exclusivo do site. O domínio do site passa pela Cloudflare.

```
                         ┌──────────────────────────┐
  Visitante ── HTTPS ──▶ │        Cloudflare        │  proxy (nuvem laranja), TLS, proteção DDoS
                         └────────────┬─────────────┘
                                      │ HTTPS (Full strict, certificado de origem)
                                      ▼
                    ┌──────────────────────────────────┐
                    │          VPS DO SITE             │
                    │  nginx :443 ──▶ Next.js          │
                    │                 127.0.0.1:3000   │
                    │  wg-site 10.20.0.1               │
                    └───────────────┬──────────────────┘
                                    │ WireGuard (UDP 51820)
                                    │ túnel exclusivo do site
                    ┌───────────────▼──────────────────────────────────────┐
                    │                 SERVIDOR FÍSICO                      │
                    │  wg-site 10.20.0.2                                   │
                    │  ├─ PostgreSQL (Docker) 10.20.0.2:5432  dados do site│
                    │  ├─ MariaDB (Pterodactyl) :3307         tabela nlogin│
                    │  └─ Servidores Minecraft (Pterodactyl)               │
                    └───────────────▲──────────────────────────────────────┘
                                    │ WireGuard existente (sem alteração)
                    ┌───────────────┴──────────────────┐
  Jogador ────────▶ │       VPS DE TRÁFEGO (jogo)      │  jogar.craftsapiens.com.br
                    └──────────────────────────────────┘
```

### Componentes

| Componente | Onde roda | Função |
|------------|-----------|--------|
| **Cloudflare** | Borda | DNS, TLS público, proteção DDoS HTTP, esconde o IP da VPS do site |
| **nginx** | VPS do site | Termina o TLS de origem, repassa ao Next.js e informa o IP real do visitante |
| **Next.js** (`next start`) | VPS do site, `127.0.0.1:3000` | Páginas e API do site |
| **WireGuard `wg-site`** | VPS do site ↔ servidor físico | Túnel privado usado só para o acesso aos bancos |
| **PostgreSQL 17** (Docker) | Servidor físico, `10.20.0.2:5432` | Dados do site: usuários, perfis, loja, fórum, blog, aulas, rate limiting |
| **MariaDB** (Database Host do Pterodactyl) | Servidor físico, porta `3307` | Tabela `nlogin`, compartilhada entre o plugin nLogin e o site |
| **Servidores Minecraft** | Servidor físico (Pterodactyl) | O jogo |
| **VPS de tráfego** | — | Entrada dos jogadores. Não faz parte do caminho do site |

### Decisões

| Decisão | Motivo |
|---------|--------|
| Site em VPS separada da VPS de tráfego | Um ataque DDoS contra o servidor de Minecraft não derruba o site nem a loja |
| Bancos no servidor físico | Os dados ficam no hardware próprio; o MariaDB do nLogin já está lá |
| Túnel WireGuard exclusivo (`wg-site`) | O site não depende da VPS de tráfego; o banco nunca fica exposto na internet |
| PostgreSQL em Docker, publicado só no IP do túnel | Isolado do Pterodactyl, fácil de atualizar e inacessível fora do túnel |
| Cloudflare com proxy | Esconde o IP da VPS do site e absorve ataques HTTP |
| Backup criptografado no Google Drive | Cópia fora do servidor físico, sem custo extra |

### Dependências e pontos de falha

| Se cair... | Efeito no site | Efeito no jogo |
|------------|----------------|----------------|
| VPS do site | Site fora do ar | Nenhum |
| Túnel `wg-site` | Site no ar, mas qualquer página que consulta o banco falha | Nenhum |
| Servidor físico | Site sem banco (mesmo efeito acima) | Fora do ar |
| VPS de tráfego | Nenhum | Jogadores não conseguem entrar |
| Cloudflare | Site inacessível pelo domínio | Nenhum (o domínio do jogo é "somente DNS") |

> O MercadoPago reenvia webhooks que falharem por algum tempo, então uma queda curta do túnel ou do servidor físico não perde confirmações de pagamento.

---

## 2. Fluxos

### Visitante abrindo uma página

```
Visitante → Cloudflare → nginx (VPS) → Next.js → PostgreSQL / MariaDB (pelo túnel) → resposta
```

### Login no site

1. Next.js busca o jogador na tabela `nlogin` (MariaDB, pelo túnel) e confere o hash da senha.
2. Busca ou cria o usuário do site no PostgreSQL.
3. Atualiza `last_seen` no `nlogin` e emite o JWT da sessão.

A mesma senha vale no site e no jogo, porque os dois usam a mesma tabela `nlogin`.

### Pagamento (webhook do MercadoPago)

```
MercadoPago → Cloudflare → nginx → /api/loja/webhook → API do MercadoPago (confere o pagamento) → PostgreSQL
```

A rota exige a assinatura `x-signature`. A Cloudflare não pode aplicar desafio anti-bot nessa rota (ver [seção 7](#7-cloudflare)).

### Jogador entrando no servidor (inalterado)

```
Jogador → VPS de tráfego → WireGuard existente → servidor físico → Minecraft → plugin nLogin → MariaDB
```

---

## 3. Rede

### Endereços e valores usados neste documento

Os valores abaixo são exemplos. Substitua pelos reais e mantenha este quadro atualizado.

| Item | Valor de exemplo |
|------|------------------|
| Domínio do site | `craftsapiens.com.br` |
| IP público da VPS do site | `<IP_PUBLICO_VPS_SITE>` |
| Rede do túnel `wg-site` | `10.20.0.0/24` |
| VPS do site no túnel | `10.20.0.1` |
| Servidor físico no túnel | `10.20.0.2` |
| Porta UDP do WireGuard na VPS do site | `51820` |
| Banco do nLogin no MariaDB | `<BANCO_NLOGIN>` (ex.: `s20_xxxxx`) |

> Use uma faixa diferente da usada pelo WireGuard da VPS de tráfego, para as rotas não se misturarem.

### Portas

| Máquina | Porta | Origem permitida | Uso |
|---------|-------|------------------|-----|
| VPS do site | `443/tcp` | Somente faixas de IP da Cloudflare | HTTPS |
| VPS do site | `51820/udp` | Qualquer (autenticado pelas chaves do WireGuard) | Túnel `wg-site` |
| VPS do site | `22/tcp` | Seu IP / VPN de administração | SSH |
| VPS do site | `3000/tcp` | Somente `127.0.0.1` | Next.js (nunca exposto) |
| Servidor físico | `5432/tcp` | Somente `10.20.0.1` pelo túnel | PostgreSQL |
| Servidor físico | `3307/tcp` | Como hoje + `10.20.0.1` pelo túnel | MariaDB do Pterodactyl |

---

## 4. WireGuard (`wg-site`)

A VPS do site é o lado que escuta (tem IP público). O servidor físico inicia a conexão, o que funciona mesmo atrás de NAT. O túnel da VPS de tráfego não é alterado.

### 4.1 Instalar e gerar as chaves (nas duas máquinas)

```bash
sudo apt update && sudo apt install -y wireguard
umask 077
wg genkey | sudo tee /etc/wireguard/wg-site.key | wg pubkey | sudo tee /etc/wireguard/wg-site.pub
```

### 4.2 VPS do site — `/etc/wireguard/wg-site.conf`

```ini
[Interface]
Address = 10.20.0.1/24
ListenPort = 51820
PrivateKey = <CHAVE_PRIVADA_DA_VPS>

[Peer]
# Servidor físico
PublicKey = <CHAVE_PUBLICA_DO_SERVIDOR_FISICO>
AllowedIPs = 10.20.0.2/32
```

### 4.3 Servidor físico — `/etc/wireguard/wg-site.conf`

```ini
[Interface]
Address = 10.20.0.2/24
PrivateKey = <CHAVE_PRIVADA_DO_SERVIDOR_FISICO>

[Peer]
# VPS do site
PublicKey = <CHAVE_PUBLICA_DA_VPS>
Endpoint = <IP_PUBLICO_VPS_SITE>:51820
AllowedIPs = 10.20.0.1/32
PersistentKeepalive = 25
```

`AllowedIPs` com `/32` garante que só as duas máquinas conversam por esse túnel; nenhuma outra rede é roteada.

### 4.4 Ativar e testar

```bash
sudo systemctl enable --now wg-quick@wg-site   # nas duas máquinas
sudo wg show wg-site                            # deve mostrar "latest handshake"
ping -c 5 10.20.0.2                             # na VPS do site
```

**Latência esperada:** abaixo de ~30 ms entre as máquinas. Cada página faz algumas consultas ao banco em sequência, então a latência do túnel soma no tempo de resposta. Acima de ~50 ms o site fica perceptivelmente lento.

---

## 5. Servidor físico

### 5.1 PostgreSQL em Docker

Crie a pasta `/opt/craftsapiens-db` com os dois arquivos abaixo.

`/opt/craftsapiens-db/.env` (permissão `600`):

```env
POSTGRES_USER=craftsapiens
POSTGRES_DB=craftsapiens
POSTGRES_PASSWORD=<SENHA_FORTE>   # openssl rand -base64 32 | tr -d '/+='
```

`/opt/craftsapiens-db/docker-compose.yml`:

```yaml
services:
  postgres:
    image: postgres:17-alpine
    container_name: craftsapiens-postgres
    restart: unless-stopped
    env_file: .env
    environment:
      POSTGRES_INITDB_ARGS: "--auth-host=scram-sha-256"
    ports:
      # Publicado SOMENTE no IP do túnel: inacessível pela internet e pela LAN
      - "10.20.0.2:5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U craftsapiens -d craftsapiens"]
      interval: 30s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
```

**O Docker precisa subir depois do túnel.** O IP `10.20.0.2` só existe quando o `wg-site` está ativo. Sem isso, após um reboot o container não consegue publicar a porta:

```bash
sudo mkdir -p /etc/systemd/system/docker.service.d
sudo tee /etc/systemd/system/docker.service.d/after-wg-site.conf <<'EOF'
[Unit]
After=wg-quick@wg-site.service
Wants=wg-quick@wg-site.service
EOF
sudo systemctl daemon-reload
```

> Isso também atrasa o Docker do Pterodactyl até o túnel subir, normalmente por menos de um segundo. Se o túnel falhar, o Docker sobe mesmo assim (`Wants`, não `Requires`).

Subir e conferir:

```bash
cd /opt/craftsapiens-db
docker compose up -d
docker compose ps                       # status "healthy"
ss -ltnp | grep 5432                    # deve mostrar 10.20.0.2:5432, nunca 0.0.0.0
```

### 5.2 MariaDB do Pterodactyl (nLogin)

O MariaDB continua como está: o plugin nLogin e o painel seguem acessando normalmente. O site só ganha acesso pelo túnel, com um usuário próprio e permissões mínimas.

**1. Confirmar que o MariaDB aceita conexões vindas do túnel:**

```bash
ss -ltnp | grep 3307
```

Se aparecer `0.0.0.0:3307` (ou `*:3307`), já aceita. Se estiver preso a outro IP específico, adicione o túnel no `bind-address` do MariaDB, ou use `0.0.0.0` e restrinja pelo usuário (passo 2).

**2. Criar o usuário do site** (como root do MariaDB):

```sql
CREATE USER 'site_nlogin'@'10.20.0.1' IDENTIFIED BY '<SENHA_FORTE>';
GRANT SELECT, INSERT, UPDATE ON `<BANCO_NLOGIN>`.`nlogin` TO 'site_nlogin'@'10.20.0.1';
FLUSH PRIVILEGES;
```

- O usuário só consegue entrar a partir do IP da VPS no túnel.
- As permissões cobrem só a tabela `nlogin`, sem `DELETE` nem `DROP` e sem acesso a outros bancos do Pterodactyl.
- O site precisa exatamente de `SELECT` (login, nomes de autores), `INSERT` (registro) e `UPDATE` (troca de senha, último login).

**3. Testar a partir da VPS do site:**

```bash
sudo apt install -y mariadb-client
mariadb -h 10.20.0.2 -P 3307 -u site_nlogin -p -e "SELECT COUNT(*) FROM \`<BANCO_NLOGIN>\`.nlogin;"
```

> Se o MariaDB rodar em container com porta publicada, a conexão pode chegar com o IP do gateway do Docker em vez de `10.20.0.1`, e o login do usuário falha. Confira com `SELECT user, host FROM information_schema.processlist;` durante uma conexão de teste e ajuste o host do usuário.

**Exposição da porta 3307 na internet.** Hoje ela é acessível publicamente. O ideal é que só o plugin nLogin (local) e o site (túnel) cheguem nela. Antes de fechar qualquer coisa, confira por qual endereço o plugin nLogin se conecta (configuração do plugin no servidor de Minecraft): se usar o domínio público, fechar a porta quebra o login dentro do jogo. Essa mudança é opcional e independente da instalação do site.

### 5.3 Firewall

Com `AllowedIPs = 10.20.0.1/32` no túnel e o PostgreSQL publicado só em `10.20.0.2`, o banco do site já fica inacessível fora do túnel. Se o servidor físico usar `ufw`, libere a interface do túnel explicitamente:

```bash
sudo ufw allow in on wg-site from 10.20.0.1 to any port 3307 proto tcp comment 'site -> MariaDB nLogin'
```

> Portas publicadas pelo Docker (como a `5432`) não passam pelas regras de entrada do `ufw`. A proteção do PostgreSQL vem de ele estar publicado somente no IP do túnel. Nunca troque para `"5432:5432"` sem IP.

> Não ative o `ufw` num host do Pterodactyl sem antes liberar SSH e as portas dos servidores de jogo, ou você perde o acesso.

---

## 6. VPS do site

### 6.1 Preparação

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx git curl ufw
sudo timedatectl set-ntp true            # relógio certo: JWT e webhook dependem dele

# Node.js 22 LTS (o projeto exige >= 20.9)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Usuário sem privilégios para rodar o site
sudo adduser --system --group --home /opt/craftsapiens craftsapiens
```

### 6.2 Código e variáveis de ambiente

```bash
sudo -u craftsapiens git clone <URL_DO_REPOSITORIO> /opt/craftsapiens/site
cd /opt/craftsapiens/site
sudo -u craftsapiens cp .env.example .env
sudo chmod 600 .env
```

Preencha o `.env` (ver [seção 8](#8-variáveis-de-ambiente-de-produção)) e instale:

```bash
sudo -u craftsapiens npm ci            # também gera os dois Prisma Clients (postinstall)
sudo -u craftsapiens npm run build
```

### 6.3 Serviço systemd

`/etc/systemd/system/craftsapiens-site.service`:

```ini
[Unit]
Description=CraftSapiens — site (Next.js)
After=network-online.target wg-quick@wg-site.service
Wants=network-online.target wg-quick@wg-site.service

[Service]
Type=simple
User=craftsapiens
Group=craftsapiens
WorkingDirectory=/opt/craftsapiens/site
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm run start -- -H 127.0.0.1 -p 3000
Restart=always
RestartSec=5
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full
ProtectHome=true

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now craftsapiens-site
sudo journalctl -u craftsapiens-site -f
```

`-H 127.0.0.1` é obrigatório: ninguém pode chegar ao Next.js sem passar pelo nginx, senão o header de IP poderia ser forjado.

Se faltar alguma variável de ambiente, o log mostra a lista completa (validação em `src/lib/env.ts`) e o site responde erro 500 até o `.env` ser corrigido.

### 6.4 nginx

**IP real do visitante.** Com a Cloudflare na frente, quem conecta no nginx é sempre um servidor da Cloudflare. O IP do visitante chega no header `CF-Connecting-IP`, e o nginx só deve aceitá-lo de IPs da Cloudflare. Gere o arquivo de faixas com:

`/usr/local/bin/cloudflare-ips.sh`:

```bash
#!/usr/bin/env bash
# Atualiza as faixas de IP da Cloudflare no nginx (real_ip) e no ufw (porta 443)
set -euo pipefail

V4=$(curl -fsS https://www.cloudflare.com/ips-v4)
V6=$(curl -fsS https://www.cloudflare.com/ips-v6)

{
  echo "# Gerado por /usr/local/bin/cloudflare-ips.sh — não editar à mão"
  for ip in $V4 $V6; do echo "set_real_ip_from $ip;"; done
  echo "real_ip_header CF-Connecting-IP;"
} > /etc/nginx/conf.d/cloudflare-realip.conf

for ip in $V4 $V6; do
  ufw allow proto tcp from "$ip" to any port 443 comment 'Cloudflare' >/dev/null
done

nginx -t && systemctl reload nginx
```

```bash
sudo chmod +x /usr/local/bin/cloudflare-ips.sh
sudo /usr/local/bin/cloudflare-ips.sh
```

> As faixas da Cloudflare mudam raramente. Rode o script de novo de tempos em tempos (por exemplo, mensalmente via cron).

**Certificado de origem.** No painel da Cloudflare: *SSL/TLS → Origin Server → Create Certificate* (validade de 15 anos). Salve:

- `/etc/ssl/cloudflare/origin.pem` (certificado)
- `/etc/ssl/cloudflare/origin.key` (chave privada, permissão `600`)

**Site** — `/etc/nginx/sites-available/craftsapiens`:

```nginx
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name craftsapiens.com.br www.craftsapiens.com.br;

    ssl_certificate     /etc/ssl/cloudflare/origin.pem;
    ssl_certificate_key /etc/ssl/cloudflare/origin.key;
    ssl_protocols TLSv1.2 TLSv1.3;

    client_max_body_size 2m;
    server_tokens off;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        # Após o real_ip, $remote_addr já é o IP do visitante (vindo do CF-Connecting-IP)
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

# Qualquer outro host (acesso direto pelo IP, por exemplo) é recusado
server {
    listen 443 ssl default_server;
    listen [::]:443 ssl default_server;
    ssl_certificate     /etc/ssl/cloudflare/origin.pem;
    ssl_certificate_key /etc/ssl/cloudflare/origin.key;
    return 444;
}
```

```bash
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -s /etc/nginx/sites-available/craftsapiens /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

> O site lê o IP do visitante somente do `X-Real-IP` (`src/lib/client-ip.ts`), usado no rate limiting. Se esse header estiver errado, todos os visitantes compartilham o mesmo limite de login.

> Os headers de segurança (CSP, HSTS, X-Frame-Options etc.) são enviados pelo Next.js (`next.config.ts`). Não os duplique no nginx nem na Cloudflare.

### 6.5 Firewall

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow from <SEU_IP_DE_ADMIN> to any port 22 proto tcp comment 'SSH'
sudo ufw allow 51820/udp comment 'WireGuard wg-site'
# A porta 443 é liberada só para a Cloudflare pelo cloudflare-ips.sh
sudo ufw enable
sudo ufw status numbered
```

Assim, mesmo que alguém descubra o IP da VPS, não consegue acessar o site sem passar pela Cloudflare.

---

## 7. Cloudflare

| Configuração | Valor | Por quê |
|--------------|-------|---------|
| DNS `craftsapiens.com.br` / `www` | Registro A para `<IP_PUBLICO_VPS_SITE>`, **proxy ativado** (nuvem laranja) | Esconde o IP da VPS do site |
| DNS `jogar.craftsapiens.com.br` | Continua apontando para a VPS de tráfego, **somente DNS** (nuvem cinza) | O tráfego do Minecraft não passa pelo proxy da Cloudflare |
| SSL/TLS → modo | **Full (strict)** | Criptografia até a VPS, validando o certificado de origem |
| SSL/TLS → Edge Certificates | *Always Use HTTPS*: ligado · *Minimum TLS*: 1.2 · *HSTS*: **desligado** | O HSTS já é enviado pelo Next.js |
| Security → Bots | *Bot Fight Mode*: **desligado** | No plano gratuito ele não pode ser ignorado por regra e bloqueia o webhook do MercadoPago |
| Security → WAF → Custom rule | Se `URI Path` igual a `/api/loja/webhook` → **Skip** (todas as proteções gerenciáveis) | O MercadoPago não resolve desafios; a rota já valida a assinatura |
| Caching → Cache Rules | Se `URI Path` começa com `/api/` → **Bypass cache** | Respostas de API nunca devem ser cacheadas |
| Speed → Rocket Loader | **Desligado** | Reescreve os scripts e quebra o Next.js e a CSP |
| Scrape Shield → Email Obfuscation | **Desligado** | Injeta scripts na página |

---

## 8. Variáveis de ambiente de produção

Arquivo `/opt/craftsapiens/site/.env` na VPS (permissão `600`, nunca versionado). Modelo completo em [`.env.example`](../.env.example).

```env
# PostgreSQL (servidor físico, pelo túnel)
POSTGRES_URL="postgresql://craftsapiens:<SENHA_POSTGRES>@10.20.0.2:5432/craftsapiens"

# MariaDB do Pterodactyl — somente a tabela nlogin (pelo túnel)
DATABASE_URL="mysql://site_nlogin:<SENHA_SITE_NLOGIN>@10.20.0.2:3307/<BANCO_NLOGIN>"

# Auth.js
AUTH_URL="https://craftsapiens.com.br"
AUTH_SECRET="<openssl rand -base64 32>"

# MercadoPago (credenciais de PRODUÇÃO)
MERCADOPAGO_ACCESS_TOKEN="APP_USR-..."
MERCADOPAGO_WEBHOOK_SECRET="<assinatura secreta do painel>"

# SMTP
SMTP_HOST="..."
SMTP_PORT=587
SMTP_SECURE="false"
SMTP_USER="..."
SMTP_PASS="..."
SMTP_FROM="noreply@craftsapiens.com.br"

# Servidor Minecraft (opcional)
MINECRAFT_SERVER_HOST="jogar.craftsapiens.com.br"
MINECRAFT_SERVER_PORT=25565
```

> Senhas com caracteres especiais (`@`, `:`, `/`, `#`) precisam ser codificadas na URL (`@` → `%40`). Gerar senhas só com letras e números evita o problema.

> Trocar o `AUTH_SECRET` desconecta todos os usuários.

---

## 9. Primeira instalação — ordem dos passos

1. **WireGuard** entre a VPS do site e o servidor físico ([seção 4](#4-wireguard-wg-site)); testar o `ping`.
2. **PostgreSQL** no servidor físico ([5.1](#51-postgresql-em-docker)); conferir `healthy`.
3. **Usuário `site_nlogin`** no MariaDB ([5.2](#52-mariadb-do-pterodactyl-nlogin)); testar a conexão a partir da VPS.
4. **Backup** configurado e testado ([seção 11](#11-backup-do-postgresql-google-drive)) **antes** de carregar dados.
5. Na VPS: código, `.env`, `npm ci` e `npm run build` ([6.1](#61-preparação) e [6.2](#62-código-e-variáveis-de-ambiente)).
6. Criar as tabelas do site:
   ```bash
   sudo -u craftsapiens npm run db:push:pg
   ```
7. **Migração dos dados antigos** (uma vez só), se ainda houver dados do site no MariaDB:
   ```bash
   sudo -u craftsapiens npm run db:migrate-v13 -- --dry-run   # confira contagens e avisos de colunas
   sudo -u craftsapiens npm run db:migrate-v13
   ```
   Antes, desative ou apague os cupons de teste `BEMVINDO10`, `SAPIENS20` e `PRIME5`, que podem existir no banco antigo.
8. **Conteúdo inicial** (depois da migração):
   ```bash
   sudo -u craftsapiens npm run db:seed
   ```
   Revise o catálogo da loja (`scripts/seed-loja.mjs`) antes.
9. **Serviço, nginx e firewall** ([6.3](#63-serviço-systemd) a [6.5](#65-firewall)).
10. **Cloudflare** ([seção 7](#7-cloudflare)) e apontamento do DNS.
11. **MercadoPago**: no painel, configurar o webhook `https://craftsapiens.com.br/api/loja/webhook` (evento *Pagamentos*) e copiar a assinatura secreta para `MERCADOPAGO_WEBHOOK_SECRET`; reiniciar o site.
12. **Validação final** ([seção 13](#13-checklist-de-validação)).

> Nunca rode `prisma db push` com o `prisma.config.ts` (MariaDB). Ele tentaria alterar o banco do Pterodactyl para ficar igual ao schema do site.

---

## 10. Atualizações (deploy de nova versão)

```bash
cd /opt/craftsapiens/site
sudo -u craftsapiens git pull
sudo -u craftsapiens npm ci
sudo -u craftsapiens npm run build
# Somente se prisma/schema.pg.prisma mudou (faça backup antes):
sudo -u craftsapiens npm run db:push:pg
sudo systemctl restart craftsapiens-site
```

O site fica alguns segundos fora do ar durante o `restart`.

**Rollback:** voltar para a versão anterior e repetir o build.

```bash
sudo -u craftsapiens git checkout <commit-anterior>
sudo -u craftsapiens npm ci && sudo -u craftsapiens npm run build
sudo systemctl restart craftsapiens-site
```

> Se a versão nova alterou o schema do banco, o rollback do código pode exigir também restaurar o backup ([11.4](#114-restauração)).

---

## 11. Backup do PostgreSQL (Google Drive)

O backup roda no servidor físico, uma vez por dia, e envia uma cópia criptografada para o Google Drive. O banco contém dados pessoais de alunos (inclusive menores de idade), por isso a criptografia é obrigatória.

### 11.1 Configurar o rclone

```bash
sudo apt install -y rclone
sudo rclone config
```

1. **Remote `gdrive`** — tipo `drive`, *scope* `drive.file` (o rclone só enxerga os arquivos que ele mesmo criar).
   - O servidor não tem navegador: escolha *"Use web browser to automatically authenticate?" → n* e rode `rclone authorize "drive"` em um computador com navegador; cole o token gerado.
   - Use uma conta Google da organização, não uma conta pessoal.
2. **Remote `gdrive-crypt`** — tipo `crypt`, apontando para `gdrive:craftsapiens-backups`, criptografando nomes de arquivos, com senha e salt fortes.

> **Guarde a senha e o salt do `gdrive-crypt` em um gerenciador de senhas, fora do servidor.** Sem eles, os backups não podem ser restaurados.

### 11.2 Script

`/usr/local/bin/craftsapiens-backup.sh` (permissão `700`):

```bash
#!/usr/bin/env bash
# Backup diário do PostgreSQL do site para o Google Drive (criptografado)
set -euo pipefail
umask 077

DIR=/var/backups/craftsapiens
STAMP=$(date +%F_%H%M)
FILE="$DIR/craftsapiens_$STAMP.dump"

mkdir -p "$DIR"

# Formato custom (-Fc): comprimido e restaurável com pg_restore
docker exec craftsapiens-postgres pg_dump -U craftsapiens -d craftsapiens -Fc > "$FILE"

# O backup não pode estar vazio
test -s "$FILE"

rclone copy "$FILE" gdrive-crypt:postgres/

# Retenção: 7 dias no disco local, 30 dias no Google Drive
find "$DIR" -name 'craftsapiens_*.dump' -mtime +7 -delete
rclone delete gdrive-crypt:postgres/ --min-age 30d

echo "Backup concluído: $FILE"
```

### 11.3 Agendamento (systemd timer)

`/etc/systemd/system/craftsapiens-backup.service`:

```ini
[Unit]
Description=CraftSapiens — backup do PostgreSQL
After=docker.service network-online.target
Wants=network-online.target

[Service]
Type=oneshot
ExecStart=/usr/local/bin/craftsapiens-backup.sh
```

`/etc/systemd/system/craftsapiens-backup.timer`:

```ini
[Unit]
Description=Backup diário do PostgreSQL do site

[Timer]
OnCalendar=*-*-* 03:30
Persistent=true
RandomizedDelaySec=10m

[Install]
WantedBy=timers.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now craftsapiens-backup.timer
sudo systemctl start craftsapiens-backup.service      # primeiro backup imediato
sudo journalctl -u craftsapiens-backup -n 20
rclone ls gdrive-crypt:postgres/                       # o arquivo deve aparecer
```

`Persistent=true` executa o backup perdido se o servidor estiver desligado no horário agendado.

### 11.4 Restauração

```bash
# 1. Baixar o backup desejado
rclone ls gdrive-crypt:postgres/
rclone copy gdrive-crypt:postgres/craftsapiens_<DATA>.dump /tmp/

# 2. Parar o site (na VPS) para ninguém gravar durante a restauração
sudo systemctl stop craftsapiens-site

# 3. Restaurar (no servidor físico)
docker exec -i craftsapiens-postgres \
  pg_restore -U craftsapiens -d craftsapiens --clean --if-exists --no-owner \
  < /tmp/craftsapiens_<DATA>.dump

# 4. Subir o site de novo (na VPS)
sudo systemctl start craftsapiens-site
```

**Teste de restauração:** uma vez por mês, restaure o backup mais recente em um banco temporário e confira as contagens. Um backup que nunca foi restaurado não garante a recuperação dos dados.

```bash
docker exec craftsapiens-postgres createdb -U craftsapiens restore_teste
docker exec -i craftsapiens-postgres pg_restore -U craftsapiens -d restore_teste --no-owner < /tmp/craftsapiens_<DATA>.dump
docker exec craftsapiens-postgres psql -U craftsapiens -d restore_teste -c "SELECT COUNT(*) FROM users;"
docker exec craftsapiens-postgres dropdb -U craftsapiens restore_teste
```

> A tabela `nlogin` (MariaDB) não entra neste backup. Ela pertence ao Pterodactyl e deve fazer parte do backup do servidor de Minecraft.

---

## 12. Operação e diagnóstico

### Comandos do dia a dia

| Onde | Comando | Para quê |
|------|---------|----------|
| VPS | `sudo systemctl status craftsapiens-site` | Estado do site |
| VPS | `sudo journalctl -u craftsapiens-site -f` | Logs do site em tempo real |
| VPS | `sudo wg show wg-site` | Estado do túnel (último handshake) |
| VPS | `ping 10.20.0.2` | Latência até o servidor físico |
| VPS | `sudo tail -f /var/log/nginx/error.log` | Erros do nginx |
| Físico | `docker compose -f /opt/craftsapiens-db/docker-compose.yml ps` | Estado do PostgreSQL |
| Físico | `systemctl list-timers craftsapiens-backup.timer` | Próximo e último backup |
| Físico | `sudo journalctl -u craftsapiens-backup -n 50` | Resultado do último backup |

### Problemas comuns

| Sintoma | Causa provável | Verificação |
|---------|----------------|-------------|
| Todas as páginas com erro 500 logo após subir | Variável de ambiente faltando ou com nome antigo | `journalctl -u craftsapiens-site` mostra a lista |
| Páginas demoram e depois dão erro | Túnel caído ou servidor físico fora do ar | `wg show wg-site`, `ping 10.20.0.2` |
| Login falha para todos, com o banco no ar | Usuário `site_nlogin` com host errado ou sem permissão | Teste com o cliente `mariadb` a partir da VPS ([5.2](#52-mariadb-do-pterodactyl-nlogin)) |
| "Muitas tentativas" para todos os visitantes ao mesmo tempo | IP real não está chegando (todos com o IP da Cloudflare) | Conferir `cloudflare-realip.conf` e o `X-Real-IP` no nginx |
| Erro 521/522 na Cloudflare | nginx parado, `ufw` bloqueando a Cloudflare ou Next.js fora do ar | `systemctl status nginx craftsapiens-site`, `ufw status` |
| Erro 526 na Cloudflare | Certificado de origem inválido ou ausente | Arquivos em `/etc/ssl/cloudflare/` e modo Full (strict) |
| Pagamento aprovado mas pedido continua pendente | Webhook bloqueado ou com secret errado | Painel do MercadoPago (histórico de notificações) e logs `[webhook]` |
| Container do PostgreSQL não sobe após reboot | Docker iniciou antes do túnel | Conferir o drop-in `after-wg-site.conf` ([5.1](#51-postgresql-em-docker)) |

### Monitoramento recomendado

- **Disponibilidade do site:** monitor HTTP externo (ex.: UptimeRobot, gratuito) em `https://craftsapiens.com.br`, com alerta por email ou Discord.
- **Backups:** conferir semanalmente `rclone ls gdrive-crypt:postgres/` e o log do último backup.
- **Espaço em disco** no servidor físico (volume do Docker e `/var/backups`).

---

## 13. Checklist de validação

Depois da instalação (e após mudanças de infraestrutura):

- [ ] `https://craftsapiens.com.br` abre com cadeado válido.
- [ ] Acessar `https://<IP_PUBLICO_VPS_SITE>` diretamente não funciona (bloqueado pelo `ufw` / `return 444`).
- [ ] `curl -sI https://craftsapiens.com.br` mostra `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options` e não mostra `X-Powered-By`.
- [ ] Do servidor físico, `ss -ltnp | grep 5432` mostra só `10.20.0.2:5432`.
- [ ] Login no site funciona com uma conta do jogo, e a mesma senha continua valendo no servidor de Minecraft.
- [ ] Cadastro de conta nova funciona e a conta consegue entrar no jogo.
- [ ] Seis tentativas de login erradas na mesma conta retornam "Muitas tentativas" só para quem tentou.
- [ ] Compra de teste com credenciais de teste do MercadoPago: pedido vai para APPROVED e o email de confirmação chega.
- [ ] Reenviar o mesmo webhook (painel do MercadoPago) não baixa o estoque de novo.
- [ ] Backup aparece no Google Drive e a restauração de teste funciona.
- [ ] Após reiniciar o servidor físico, túnel, PostgreSQL e site voltam sozinhos.

---

## 14. Pendências de código para esta arquitetura

Com os bancos a alguns milissegundos de distância e dependentes do túnel, estes ajustes são recomendados. Ainda não foram implementados:

| Ajuste | Benefício |
|--------|-----------|
| Timeouts de conexão nos clientes PostgreSQL e MariaDB (`src/lib/prisma.ts`) | Se o túnel cair, as páginas falham em poucos segundos em vez de travar |
| Cache de 60 s nas APIs públicas (`/api/loja/produtos`, `/api/ranking`, `/api/estatisticas`) | Menos consultas atravessando o túnel nas páginas mais acessadas |
| Página de manutenção quando o banco estiver inacessível | Mensagem de manutenção em vez de erro 500 |
| Rota de health check (`/api/health`) testando os dois bancos | Monitoramento externo detecta queda do túnel, não só do site |
