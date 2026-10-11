# Arquitetura de Produção

> Propósito: descrever onde cada parte do site roda em produção, como as máquinas se comunicam e o passo a passo para instalar, atualizar, fazer backup e recuperar o ambiente.

---

## 1. Visão geral

O site (Next.js) e os bancos de dados rodam no servidor físico, junto com os servidores de Minecraft. Uma VPS pequena da Oracle (Always Free) serve só de porta de entrada: recebe o tráfego da Cloudflare e o repassa ao servidor físico por um túnel WireGuard exclusivo do site.

```
                         ┌──────────────────────────┐
  Visitante ── HTTPS ──▶ │        Cloudflare        │  proxy, TLS, proteção DDoS, cache dos estáticos
                         └────────────┬─────────────┘
                                      │ HTTPS (Full strict, certificado de origem)
                                      ▼
                    ┌──────────────────────────────────┐
                    │   VPS DE ENTRADA (Oracle Free)   │
                    │  nginx :443                      │
                    │  wg-site 10.20.0.1               │
                    └───────────────┬──────────────────┘
                                    │ WireGuard (UDP 51820)
                                    │ HTTP para 10.20.0.2:3000
                    ┌───────────────▼──────────────────────────────────────┐
                    │                 SERVIDOR FÍSICO                      │
                    │  wg-site 10.20.0.2                                   │
                    │  ├─ Next.js 10.20.0.2:3000          páginas e API    │
                    │  ├─ PostgreSQL (Docker) 127.0.0.1:5432  dados do site│
                    │  ├─ MariaDB (Pterodactyl) :3307     tabela nlogin    │
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
| **Cloudflare** | Borda | DNS, TLS público, proteção DDoS HTTP, cache dos arquivos estáticos, esconde o IP da VPS |
| **nginx** | VPS de entrada | Termina o TLS de origem, informa o IP real do visitante e repassa ao Next.js pelo túnel; mostra a página de manutenção quando o site não responde |
| **WireGuard `wg-site`** | VPS de entrada ↔ servidor físico | Túnel privado que leva as requisições do nginx ao Next.js |
| **Next.js** (`next start`) | Servidor físico, `10.20.0.2:3000` | Páginas e API do site |
| **PostgreSQL 17** (Docker) | Servidor físico, `127.0.0.1:5432` | Dados do site: usuários, perfis, loja, fórum, blog, aulas, rate limiting |
| **MariaDB** (Database Host do Pterodactyl) | Servidor físico, porta `3307` | Tabela `nlogin`, compartilhada entre o plugin nLogin e o site |
| **Servidores Minecraft** | Servidor físico (Pterodactyl) | O jogo |
| **VPS de tráfego** | — | Entrada dos jogadores. Não faz parte do caminho do site |

### Decisões

| Decisão | Motivo |
|---------|--------|
| Next.js no servidor físico, junto dos bancos | As consultas ao banco são locais. O túnel é atravessado uma vez por requisição, e não uma vez por consulta |
| VPS de entrada só com nginx | A VPS gratuita da Oracle (1 núcleo, 500 MB de RAM) não consegue compilar o site e ficaria sem memória rodando o Next.js. Para nginx e WireGuard, sobra |
| Entrada do site separada da VPS de tráfego | Um ataque DDoS contra o servidor de Minecraft não derruba o site nem a loja |
| Túnel WireGuard exclusivo (`wg-site`) | O site não depende da VPS de tráfego, e o servidor físico não precisa de nenhuma porta aberta para o site |
| PostgreSQL em Docker, publicado só em `127.0.0.1` | Isolado do Pterodactyl, fácil de atualizar e inacessível de fora da máquina, nem pelo túnel |
| Cloudflare com proxy | Esconde o IP da VPS, absorve ataques HTTP e guarda em cache os arquivos estáticos, o que poupa o upload do servidor físico |
| Backup criptografado no Google Drive | Cópia fora do servidor físico, sem custo extra |

### Dependências e pontos de falha

| Se cair... | Efeito no site | Efeito no jogo |
|------------|----------------|----------------|
| VPS de entrada | Site fora do ar (erro da Cloudflare) | Nenhum |
| Túnel `wg-site` | Página de manutenção (servida pela VPS) | Nenhum |
| Next.js | Página de manutenção | Nenhum |
| Servidor físico | Página de manutenção | Fora do ar |
| VPS de tráfego | Nenhum | Jogadores não conseguem entrar |
| Cloudflare | Site inacessível pelo domínio | Nenhum (o domínio do jogo é "somente DNS") |

> O MercadoPago reenvia webhooks que falharem por algum tempo, então uma queda curta do túnel ou do servidor físico não perde confirmações de pagamento.

> A VPS de entrada não guarda dados. Se ela for perdida, basta criar outra seguindo a [seção 7](#7-vps-de-entrada-oracle), trocar a chave pública no WireGuard do servidor físico e o IP no DNS da Cloudflare.

---

## 2. Fluxos

### Visitante abrindo uma página

```
Visitante → Cloudflare → nginx (VPS) → túnel → Next.js (servidor físico) → PostgreSQL / MariaDB (locais) → resposta
```

### Login no site

1. Next.js busca o jogador na tabela `nlogin` (MariaDB) e confere o hash da senha.
2. Busca ou cria o usuário do site no PostgreSQL.
3. Atualiza `last_seen` no `nlogin` e emite o JWT da sessão.

A mesma senha vale no site e no jogo, porque os dois usam a mesma tabela `nlogin`.

### Pagamento (webhook do MercadoPago)

```
MercadoPago → Cloudflare → nginx → túnel → /api/loja/webhook → API do MercadoPago (confere o pagamento) → PostgreSQL
```

A rota exige a assinatura `x-signature`. A Cloudflare não pode aplicar desafio anti-bot nessa rota (ver [seção 8](#8-cloudflare)).

### Jogador entrando no servidor (inalterado)

```
Jogador → VPS de tráfego → WireGuard existente → servidor físico → Minecraft → plugin nLogin → MariaDB
```

---

## 3. Rede

### Endereços e valores usados neste documento

Os valores abaixo são exemplos. Este repositório é público: os valores reais (IPs, nomes de banco, senhas) ficam fora dele e nunca devem ser escritos aqui.

| Item | Valor de exemplo |
|------|------------------|
| Domínio do site | `craftsapiens.com.br` |
| IP público da VPS de entrada | `<IP_PUBLICO_VPS_ENTRADA>` |
| Rede do túnel `wg-site` | `10.20.0.0/24` |
| VPS de entrada no túnel | `10.20.0.1` |
| Servidor físico no túnel | `10.20.0.2` |
| Porta UDP do WireGuard na VPS de entrada | `51820` |
| Porta do Next.js no servidor físico | `3000` |
| Banco do nLogin no MariaDB | `<BANCO_NLOGIN>` |

> Use uma faixa diferente da usada pelo WireGuard da VPS de tráfego, para as rotas não se misturarem.

### Portas

| Máquina | Porta | Origem permitida | Uso |
|---------|-------|------------------|-----|
| VPS de entrada | `443/tcp` | Somente faixas de IP da Cloudflare | HTTPS |
| VPS de entrada | `51820/udp` | Qualquer (autenticado pelas chaves do WireGuard) | Túnel `wg-site` |
| VPS de entrada | `22/tcp` | Seu IP / VPN de administração | SSH |
| Servidor físico | `3000/tcp` | Somente `10.20.0.1` pelo túnel | Next.js (ouve só em `10.20.0.2`) |
| Servidor físico | `5432/tcp` | Somente `127.0.0.1` | PostgreSQL |
| Servidor físico | `3307/tcp` | Como hoje (o site conecta localmente) | MariaDB do Pterodactyl |

O servidor físico não precisa de nenhuma porta nova aberta na internet: é ele que inicia o túnel até a VPS.

---

## 4. WireGuard (`wg-site`)

A VPS de entrada é o lado que escuta (tem IP público). O servidor físico inicia a conexão, o que funciona mesmo atrás de NAT. O túnel da VPS de tráfego não é alterado.

### 4.1 Instalar e gerar as chaves (nas duas máquinas)

```bash
sudo apt update && sudo apt install -y wireguard
umask 077
wg genkey | sudo tee /etc/wireguard/wg-site.key | wg pubkey | sudo tee /etc/wireguard/wg-site.pub
```

### 4.2 VPS de entrada — `/etc/wireguard/wg-site.conf`

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
# VPS de entrada
PublicKey = <CHAVE_PUBLICA_DA_VPS>
Endpoint = <IP_PUBLICO_VPS_ENTRADA>:51820
AllowedIPs = 10.20.0.1/32
PersistentKeepalive = 25
```

`AllowedIPs` com `/32` garante que só as duas máquinas conversam por esse túnel; nenhuma outra rede é roteada.

### 4.4 Ativar e testar

```bash
sudo systemctl enable --now wg-quick@wg-site   # nas duas máquinas
sudo wg show wg-site                            # deve mostrar "latest handshake"
ping -c 5 10.20.0.2                             # na VPS de entrada
```

**Latência e banda:** cada requisição atravessa o túnel uma vez, então a latência entre as máquinas soma uma vez no tempo de resposta. Todas as respostas que não estão no cache da Cloudflare (HTML e API) saem pelo upload da internet do servidor físico.

> A Oracle permite UDP 51820 na VPS só depois de liberado na rede da instância ([7.1](#71-instância-e-rede-na-oracle)). Se o `wg show` não mostrar handshake, confira isso primeiro.

---

## 5. Servidor físico — bancos

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
      # Publicado SOMENTE no loopback: inacessível pela internet, pela LAN e pelo túnel
      - "127.0.0.1:5432:5432"
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

Subir e conferir:

```bash
cd /opt/craftsapiens-db
docker compose up -d
docker compose ps                       # status "healthy"
ss -ltnp | grep 5432                    # deve mostrar 127.0.0.1:5432, nunca 0.0.0.0
```

> Se a porta `5432` já estiver em uso no servidor físico, troque só o lado do host (por exemplo `"127.0.0.1:5433:5432"`) e ajuste o `POSTGRES_URL`.

### 5.2 MariaDB do Pterodactyl (nLogin)

O MariaDB continua como está: o plugin nLogin e o painel seguem acessando normalmente. O site ganha um usuário próprio, com permissões mínimas, que só entra a partir da própria máquina.

**1. Criar o usuário do site** (como root do MariaDB):

```sql
CREATE USER 'site_nlogin'@'127.0.0.1' IDENTIFIED BY '<SENHA_FORTE>';
GRANT SELECT, INSERT, UPDATE ON `<BANCO_NLOGIN>`.`nlogin` TO 'site_nlogin'@'127.0.0.1';
FLUSH PRIVILEGES;
```

- O usuário só consegue entrar a partir do próprio servidor físico.
- As permissões cobrem só a tabela `nlogin`, sem `DELETE` nem `DROP` e sem acesso a outros bancos do Pterodactyl.
- O site precisa exatamente de `SELECT` (login, nomes de autores), `INSERT` (registro) e `UPDATE` (troca de senha, último login).

**2. Testar no servidor físico:**

```bash
mariadb -h 127.0.0.1 -P 3307 -u site_nlogin -p -e "SELECT COUNT(*) FROM \`<BANCO_NLOGIN>\`.nlogin;"
```

> Use `127.0.0.1`, não `localhost`, aqui e no `DATABASE_URL`. Com `localhost`, o cliente pode conectar por socket ou por IPv6 (`::1`), e o usuário criado para `127.0.0.1` não é aceito.

> Se o MariaDB rodar em container com porta publicada, a conexão pode chegar com o IP do gateway do Docker em vez de `127.0.0.1`, e o login do usuário falha. Confira com `SELECT user, host FROM information_schema.processlist;` durante uma conexão de teste e ajuste o host do usuário.

**Exposição da porta 3307.** Se a porta `3307` estiver acessível pela internet, o ideal é fechá-la, deixando só o plugin nLogin e o site (ambos locais) chegarem nela. Antes de fechar, confira por qual endereço o plugin nLogin se conecta (configuração do plugin no servidor de Minecraft): se usar um domínio ou IP público, fechar a porta quebra o login dentro do jogo. Essa mudança é independente da instalação do site.

---

## 6. Servidor físico — site (Next.js)

### 6.1 Preparação

```bash
sudo apt update
sudo apt install -y git curl
sudo timedatectl set-ntp true            # relógio certo: JWT e webhook dependem dele

# Node.js 22 LTS (o projeto exige >= 20.9)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Usuário sem privilégios para rodar o site
sudo adduser --system --group --home /opt/craftsapiens craftsapiens
```

O Node.js instalado no sistema não interfere no Pterodactyl: os servidores de Minecraft rodam em containers do Wings.

Confira que a porta `3000` está livre: `ss -ltnp | grep ':3000'` não deve mostrar nada.

### 6.2 Código e variáveis de ambiente

```bash
sudo -u craftsapiens git clone <URL_DO_REPOSITORIO> /opt/craftsapiens/site
cd /opt/craftsapiens/site
sudo -u craftsapiens cp .env.example .env
sudo chmod 600 .env
```

Preencha o `.env` (ver [seção 9](#9-variáveis-de-ambiente-de-produção)) e instale:

```bash
sudo -u craftsapiens npm ci                    # também gera os dois Prisma Clients (postinstall)
sudo -u craftsapiens nice -n 10 npm run build  # prioridade baixa para não atrapalhar o jogo
```

### 6.3 Serviço systemd

`/etc/systemd/system/craftsapiens-site.service`:

```ini
[Unit]
Description=CraftSapiens — site (Next.js)
After=network-online.target wg-quick@wg-site.service docker.service
Wants=network-online.target wg-quick@wg-site.service

[Service]
Type=simple
User=craftsapiens
Group=craftsapiens
WorkingDirectory=/opt/craftsapiens/site
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm run start -- -H 10.20.0.2 -p 3000 --keepAliveTimeout 70000
Restart=always
RestartSec=5
# Limites para o site não disputar recursos com os servidores de Minecraft
MemoryMax=1G
CPUWeight=50
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

- `-H 10.20.0.2` é obrigatório: o Next.js só aceita conexões que chegam pelo túnel, e ninguém chega a ele sem passar pelo nginx da VPS, senão o header de IP poderia ser forjado. Se o túnel ainda não estiver ativo no boot, o Next.js não consegue abrir a porta e o systemd tenta de novo a cada 5 s.
- `--keepAliveTimeout 70000` mantém as conexões abertas por mais tempo que o nginx da VPS, que as reaproveita. Sem isso, o Node fecha conexões que o nginx ainda pretende usar, e alguns visitantes recebem erro 502 de vez em quando.
- `MemoryMax=1G`: o Next.js usa de 200 a 400 MB. Se passar de 1 GB, o processo é encerrado e reiniciado, em vez de tirar memória dos servidores de Minecraft. `CPUWeight=50` dá ao site metade da prioridade padrão de CPU quando a máquina estiver ocupada.

Se faltar alguma variável de ambiente, o log mostra a lista completa (validação em `src/lib/env.ts`) e o site responde erro 500 até o `.env` ser corrigido.

### 6.4 Firewall da porta 3000

O Next.js ouve só no IP do túnel (`10.20.0.2`), então não é acessível pela internet nem pela rede local. No túnel, `AllowedIPs = 10.20.0.1/32` garante que só a VPS de entrada chega nele.

Processos do próprio servidor físico, inclusive os containers dos servidores de Minecraft, ainda conseguem abrir `10.20.0.2:3000` diretamente. Quem fizer isso pode informar qualquer IP no `X-Real-IP` e escapar do rate limiting por IP. Se o servidor físico usar `ufw`, feche esse caminho:

```bash
sudo ufw allow in on wg-site from 10.20.0.1 to any port 3000 proto tcp comment 'VPS de entrada -> site'
sudo ufw deny 3000/tcp comment 'site so pelo tunel'
```

> Não ative o `ufw` num host do Pterodactyl sem antes liberar SSH e as portas dos servidores de jogo, ou você perde o acesso.

### 6.5 Atualização automática das aulas (YouTube)

A página `/aulas` lista os vídeos e lives públicos do canal da Craftsapiens no YouTube. Um timer roda `npm run aulas:atualizar` a cada 3 horas: lista o canal com o yt-dlp e grava as aulas novas no banco (ver [`docs/paginas/03-aulas.md`](paginas/03-aulas.md)).

A lista fica em `/var/lib/craftsapiens/`, fora do repositório, para não alterar arquivos versionados e travar o `git pull` do deploy. Na primeira execução, o script parte do `scripts/data/youtube-videos.json` do repositório e só consulta os vídeos novos.

Instalar o yt-dlp (binário único, sem Python) e criar a pasta:

```bash
sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux -o /usr/local/bin/yt-dlp
sudo chmod a+rx /usr/local/bin/yt-dlp
sudo mkdir -p /var/lib/craftsapiens
sudo chown craftsapiens: /var/lib/craftsapiens
```

No `.env`:

```env
AULAS_YOUTUBE_FILE="/var/lib/craftsapiens/youtube-videos.json"
```

`/etc/systemd/system/craftsapiens-aulas.service`:

```ini
[Unit]
Description=CraftSapiens — atualização das aulas com os vídeos do YouTube
After=network-online.target docker.service
Wants=network-online.target

[Service]
Type=oneshot
User=craftsapiens
WorkingDirectory=/opt/craftsapiens/site
Nice=10
# O YouTube muda com frequência: atualiza o yt-dlp antes ("+" roda como root, "-" ignora falhas)
ExecStartPre=-+/usr/local/bin/yt-dlp -U
ExecStart=/usr/bin/npm run aulas:atualizar
```

`/etc/systemd/system/craftsapiens-aulas.timer`:

```ini
[Unit]
Description=Atualização das aulas a cada 3 horas

[Timer]
OnCalendar=*-*-* 00/3:15
Persistent=true
RandomizedDelaySec=5m

[Install]
WantedBy=timers.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now craftsapiens-aulas.timer
sudo systemctl start craftsapiens-aulas.service      # primeira execução imediata
sudo journalctl -u craftsapiens-aulas -n 30
```

Comportamento em falhas:

- Se a listagem falhar ou vier com menos de 80% dos vídeos da execução anterior, nada é gravado e o site continua com a lista atual. Uma redução real (vídeos apagados ou privados) exige rodar uma vez à mão com `npm run aulas:youtube -- --forcar` e depois `npm run db:seed:aulas`.
- Se a data de um vídeo novo não puder ser consultada, ele entra com a data da execução e é consultado de novo na próxima.
- O YouTube às vezes pede login ("Sign in to confirm you're not a bot"), principalmente para IPs de datacenter. Se isso aparecer no log, exporte os cookies de uma conta do YouTube em formato Netscape para `/var/lib/craftsapiens/cookies.txt` (dono `craftsapiens`, permissão `600`) e defina `YTDLP="/usr/local/bin/yt-dlp --cookies /var/lib/craftsapiens/cookies.txt"` no `.env`.

Lives novas com título genérico ("Aula no Minecraft") entram em "Outras Aulas". Para classificá-las, transcreva o título da miniatura em `scripts/lib/youtube-titulos.mjs` e publique a versão.

---

## 7. VPS de entrada (Oracle)

A VPS roda só nginx e WireGuard, que usam menos de 100 MB de RAM. A instância micro do Always Free (1 núcleo, 500 MB) é suficiente.

### 7.1 Instância e rede na Oracle

**Imagem:** Ubuntu LTS.

**Regras de entrada da rede.** A Oracle tem um firewall próprio, fora da máquina, na *Security List* da sub-rede (*Networking → Virtual Cloud Networks → sub-rede da instância → Security List*). Deixe só estas regras de entrada:

| Protocolo | Porta | Origem | Observação |
|-----------|-------|--------|------------|
| TCP | `22` | Seu IP de administração | Troque a regra padrão, que libera o SSH para `0.0.0.0/0` |
| TCP | `443` | `0.0.0.0/0` | O `ufw` da VPS restringe às faixas da Cloudflare |
| UDP | `51820` | `0.0.0.0/0` (ou o IP fixo do servidor físico, se houver) | Túnel `wg-site` |

**Instâncias ociosas.** Pela política atual da Oracle, instâncias Always Free com uso baixo de CPU e de rede (abaixo de 20% por 7 dias) podem ser recuperadas, e uma VPS que só roda nginx se encaixa nisso. Para evitar, converta a conta para *Pay As You Go*: os recursos Always Free continuam sem cobrança e a instância deixa de ser recuperada. Depois da conversão, tome cuidado para não criar recursos fora do Always Free.

### 7.2 Preparação

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx curl ufw
sudo timedatectl set-ntp true
```

O WireGuard é instalado na [seção 4](#4-wireguard-wg-site). A VPS não precisa de Node.js nem do código do site.

### 7.3 nginx

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

**Página de manutenção.** Quando o túnel, o servidor físico ou o Next.js estiverem fora do ar, o nginx responde com uma página estática guardada na própria VPS, em vez do erro genérico.

`/var/www/craftsapiens/manutencao.html`:

```html
<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>CraftSapiens em manutenção</title>
  <style>
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 16px;
           font-family: system-ui, sans-serif; background: #111; color: #eee; text-align: center; }
  </style>
</head>
<body>
  <main>
    <h1>Voltamos em instantes</h1>
    <p>O site está em manutenção. Tente de novo em alguns minutos.</p>
  </main>
</body>
</html>
```

**Site** — `/etc/nginx/sites-available/craftsapiens`:

```nginx
upstream craftsapiens_site {
    server 10.20.0.2:3000;
    keepalive 16;
}

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
        proxy_pass http://craftsapiens_site;
        proxy_http_version 1.1;
        proxy_set_header Connection "";          # reaproveita as conexões com o Next.js
        proxy_set_header Host $host;
        # Após o real_ip, $remote_addr já é o IP do visitante (vindo do CF-Connecting-IP)
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto https;
        proxy_connect_timeout 5s;                # túnel caído: manutenção em 5 s, sem esperar
        proxy_read_timeout 60s;
    }

    # Next.js inacessível (túnel, servidor físico ou serviço parado)
    error_page 502 504 =503 /manutencao.html;
    location = /manutencao.html {
        root /var/www/craftsapiens;
        internal;
        add_header Cache-Control "no-store" always;
        add_header Retry-After 120 always;
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
curl -sI http://10.20.0.2:3000 | head -1      # o Next.js responde pelo túnel
```

- A página de manutenção responde com status `503`, então monitores externos detectam a queda. Erros 500 do próprio site passam sem alteração.
- O site lê o IP do visitante somente do `X-Real-IP` (`src/lib/client-ip.ts`), usado no rate limiting. Se esse header estiver errado, todos os visitantes compartilham o mesmo limite de login.
- Os headers de segurança (CSP, HSTS, X-Frame-Options etc.) são enviados pelo Next.js (`next.config.ts`). Não os duplique no nginx nem na Cloudflare.

### 7.4 Firewall

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow from <SEU_IP_DE_ADMIN> to any port 22 proto tcp comment 'SSH'
sudo ufw allow 51820/udp comment 'WireGuard wg-site'
# A porta 443 é liberada só para a Cloudflare pelo cloudflare-ips.sh
sudo ufw enable
sudo ufw status numbered
```

**Regras de iptables da imagem da Oracle.** As imagens Ubuntu da Oracle vêm com regras de iptables próprias (`/etc/iptables/rules.v4`) que rejeitam tudo além do SSH e conflitam com o `ufw`. Com o `ufw` já ativo e o SSH liberado nele, remova o pacote que carrega essas regras no boot e reinicie:

```bash
sudo apt purge -y iptables-persistent netfilter-persistent
sudo reboot
# Depois de voltar:
sudo ufw status verbose          # ativo, com as regras acima
sudo systemctl status nginx wg-quick@wg-site
```

O `ufw` libera todo o tráfego de saída, o que mantém o acesso aos serviços internos da Oracle (`169.254.0.0/16`).

Assim, mesmo que alguém descubra o IP da VPS, não consegue acessar o site sem passar pela Cloudflare.

---

## 8. Cloudflare

| Configuração | Valor | Por quê |
|--------------|-------|---------|
| DNS `craftsapiens.com.br` / `www` | Registro A para `<IP_PUBLICO_VPS_ENTRADA>`, **proxy ativado** (nuvem laranja) | Esconde o IP da VPS de entrada |
| DNS `jogar.craftsapiens.com.br` | Continua apontando para a VPS de tráfego, **somente DNS** (nuvem cinza) | O tráfego do Minecraft não passa pelo proxy da Cloudflare |
| SSL/TLS → modo | **Full (strict)** | Criptografia até a VPS, validando o certificado de origem |
| SSL/TLS → Edge Certificates | *Always Use HTTPS*: ligado · *Minimum TLS*: 1.2 · *HSTS*: **desligado** | O HSTS já é enviado pelo Next.js |
| Security → Bots | *Bot Fight Mode*: **desligado** | No plano gratuito ele não pode ser ignorado por regra e bloqueia o webhook do MercadoPago |
| Security → WAF → Custom rule | Se `URI Path` igual a `/api/loja/webhook` → **Skip** (todas as proteções gerenciáveis) | O MercadoPago não resolve desafios; a rota já valida a assinatura |
| Caching → Cache Rules | Se `URI Path` começa com `/api/` → **Bypass cache** | Respostas de API nunca devem ser cacheadas |
| Caching → Cache Rules | Se `URI Path` começa com `/_next/image` → **Eligible for cache**, *Edge TTL*: usar o `Cache-Control` da origem | Imagens otimizadas pelo Next.js não têm extensão e não entram no cache por padrão; com a regra, saem do servidor físico uma vez só |
| Speed → Rocket Loader | **Desligado** | Reescreve os scripts e quebra o Next.js e a CSP |
| Scrape Shield → Email Obfuscation | **Desligado** | Injeta scripts na página |

Os arquivos de `/_next/static` (JavaScript, CSS, fontes) e as imagens de `public/` já entram no cache da Cloudflare pela extensão, sem regra.

---

## 9. Variáveis de ambiente de produção

Arquivo `/opt/craftsapiens/site/.env` no servidor físico (permissão `600`, nunca versionado). Modelo completo em [`.env.example`](../.env.example).

```env
# PostgreSQL (container no próprio servidor físico)
POSTGRES_URL="postgresql://craftsapiens:<SENHA_POSTGRES>@127.0.0.1:5432/craftsapiens"

# MariaDB do Pterodactyl — somente a tabela nlogin
DATABASE_URL="mysql://site_nlogin:<SENHA_SITE_NLOGIN>@127.0.0.1:3307/<BANCO_NLOGIN>"

# Auth.js
AUTH_URL="https://craftsapiens.com.br"
AUTH_SECRET="<openssl rand -base64 32>"

# MercadoPago (credenciais de PRODUÇÃO)
MERCADOPAGO_ACCESS_TOKEN="APP_USR-..."
MERCADOPAGO_WEBHOOK_SECRET="<assinatura secreta do painel>"
# Token do plugin de entregas da loja (o mesmo vai no config.yml do plugin)
DELIVERY_API_TOKEN="<openssl rand -hex 32>"

# E-mail: SMTP do Gmail com senha de app (ver docs/email.md)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=465
SMTP_SECURE="true"
SMTP_USER="<Gmail da equipe>"
SMTP_PASS="<senha de app>"
SMTP_FROM="nao-responda@craftsapiens.com.br"
SMTP_FROM_NAME="CraftSapiens"
SMTP_REPLY_TO="contato@craftsapiens.com.br"
CONTACT_INBOX="contato@craftsapiens.com.br"

# Login externo (opcional; ver docs/login-externo.md)
AUTH_GOOGLE_ID="..."
AUTH_GOOGLE_SECRET="..."
AUTH_MICROSOFT_ID="..."
AUTH_MICROSOFT_SECRET="..."

# Servidor Minecraft (opcional)
MINECRAFT_SERVER_HOST="jogar.craftsapiens.com.br"
# MINECRAFT_SERVER_PORT: deixe sem definir; a porta vem do registro SRV do domínio
```

> Senhas com caracteres especiais (`@`, `:`, `/`, `#`) precisam ser codificadas na URL (`@` → `%40`). Gerar senhas só com letras e números evita o problema.

> Trocar o `AUTH_SECRET` desconecta todos os usuários.

---

## 10. Primeira instalação — ordem dos passos

1. **VPS de entrada na Oracle**: instância, regras de rede e firewall ([7.1](#71-instância-e-rede-na-oracle), [7.2](#72-preparação) e [7.4](#74-firewall)).
2. **WireGuard** entre a VPS de entrada e o servidor físico ([seção 4](#4-wireguard-wg-site)); testar o `ping`.
3. **PostgreSQL** no servidor físico ([5.1](#51-postgresql-em-docker)); conferir `healthy`.
4. **Usuário `site_nlogin`** no MariaDB ([5.2](#52-mariadb-do-pterodactyl-nlogin)); testar a conexão.
5. **Backup** configurado e testado ([seção 12](#12-backup-do-postgresql-google-drive)) **antes** de carregar dados.
6. No servidor físico: Node.js, código, `.env`, `npm ci` e `npm run build` ([6.1](#61-preparação) e [6.2](#62-código-e-variáveis-de-ambiente)).
7. Criar as tabelas do site:
   ```bash
   sudo -u craftsapiens npm run db:push:pg
   ```
8. **Migração dos dados antigos** (uma vez só), se ainda houver dados do site no MariaDB:
   ```bash
   sudo -u craftsapiens npm run db:migrate-v13 -- --dry-run   # confira contagens e avisos de colunas
   sudo -u craftsapiens npm run db:migrate-v13
   ```
   Os cupons do banco antigo são de teste e chegam desativados. Crie os cupons reais só depois da migração.
9. **Conteúdo inicial** (depois da migração):
   ```bash
   sudo -u craftsapiens npm run db:seed
   ```
   Revise o catálogo da loja (`scripts/seed-loja.mjs`) antes.
10. **Serviço do site, firewall da porta 3000 e atualização automática das aulas** ([6.3](#63-serviço-systemd) a [6.5](#65-atualização-automática-das-aulas-youtube)).
11. **nginx e página de manutenção** na VPS de entrada ([7.3](#73-nginx)); o `curl` para `10.20.0.2:3000` deve responder.
12. **Cloudflare** ([seção 8](#8-cloudflare)) e apontamento do DNS.
13. **MercadoPago** ([docs/mercadopago.md](./mercadopago.md)): no painel, configurar o webhook `https://craftsapiens.com.br/api/loja/webhook` (evento *Pagamentos*) e copiar a assinatura secreta para `MERCADOPAGO_WEBHOOK_SECRET`; a conta precisa ter uma **chave Pix** cadastrada, senão a criação do Pix falha; reiniciar o site.
14. **Plugin de entregas**: gerar `DELIVERY_API_TOKEN`, colocar no `.env` do site e no `config.yml` do plugin no lobby ([docs/plugin-entregas.md](./plugin-entregas.md)); conferir que o `products.yml` do plugin tem os mesmos slugs do `scripts/seed-loja.mjs` e que o comando de Sapiens foi confirmado no console.
15. **Validação final** ([seção 14](#14-checklist-de-validação)).

> Nunca rode `prisma db push` com o `prisma.config.ts` (MariaDB). Ele tentaria alterar o banco do Pterodactyl para ficar igual ao schema do site.

---

## 11. Atualizações (deploy de nova versão)

No servidor físico:

```bash
cd /opt/craftsapiens/site
sudo -u craftsapiens git pull
sudo -u craftsapiens npm ci
sudo -u craftsapiens nice -n 10 npm run build
# Somente se prisma/schema.pg.prisma mudou (faça backup antes):
sudo -u craftsapiens npm run db:push:pg
sudo systemctl restart craftsapiens-site
```

- Enquanto o `npm run build` roda, a versão em execução pode falhar em algumas páginas, porque a pasta `.next` está sendo reescrita. Faça o deploy em horário de pouco movimento.
- Durante o `restart`, por alguns segundos, os visitantes veem a página de manutenção.

**Rollback:** voltar para a versão anterior e repetir o build.

```bash
sudo -u craftsapiens git checkout <commit-anterior>
sudo -u craftsapiens npm ci && sudo -u craftsapiens nice -n 10 npm run build
sudo systemctl restart craftsapiens-site
```

> Se a versão nova alterou o schema do banco, o rollback do código pode exigir também restaurar o backup ([12.4](#124-restauração)).

---

## 12. Backup do PostgreSQL (Google Drive)

O backup roda no servidor físico, uma vez por dia, e envia uma cópia criptografada para o Google Drive. O banco contém dados pessoais de alunos (inclusive menores de idade), por isso a criptografia é obrigatória.

### 12.1 Configurar o rclone

```bash
sudo apt install -y rclone
sudo rclone config
```

1. **Remote `gdrive`** — tipo `drive`, *scope* `drive.file` (o rclone só enxerga os arquivos que ele mesmo criar).
   - O servidor não tem navegador: escolha *"Use web browser to automatically authenticate?" → n* e rode `rclone authorize "drive"` em um computador com navegador; cole o token gerado.
   - Use uma conta Google da organização, não uma conta pessoal.
2. **Remote `gdrive-crypt`** — tipo `crypt`, apontando para `gdrive:craftsapiens-backups`, criptografando nomes de arquivos, com senha e salt fortes.

> **Guarde a senha e o salt do `gdrive-crypt` em um gerenciador de senhas, fora do servidor.** Sem eles, os backups não podem ser restaurados.

### 12.2 Script

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

### 12.3 Agendamento (systemd timer)

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

### 12.4 Restauração

No servidor físico:

```bash
# 1. Baixar o backup desejado
rclone ls gdrive-crypt:postgres/
rclone copy gdrive-crypt:postgres/craftsapiens_<DATA>.dump /tmp/

# 2. Parar o site para ninguém gravar durante a restauração (a VPS mostra a página de manutenção)
sudo systemctl stop craftsapiens-site

# 3. Restaurar
docker exec -i craftsapiens-postgres \
  pg_restore -U craftsapiens -d craftsapiens --clean --if-exists --no-owner \
  < /tmp/craftsapiens_<DATA>.dump

# 4. Subir o site de novo
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

## 13. Operação e diagnóstico

### Comandos do dia a dia

| Onde | Comando | Para quê |
|------|---------|----------|
| Físico | `sudo systemctl status craftsapiens-site` | Estado do site |
| Físico | `sudo journalctl -u craftsapiens-site -f` | Logs do site em tempo real |
| Físico | `systemctl list-timers craftsapiens-aulas.timer` | Próxima e última atualização das aulas |
| Físico | `sudo journalctl -u craftsapiens-aulas -n 50` | Resultado da última atualização das aulas |
| Físico | `docker compose -f /opt/craftsapiens-db/docker-compose.yml ps` | Estado do PostgreSQL |
| Físico | `systemctl list-timers craftsapiens-backup.timer` | Próximo e último backup |
| Físico | `sudo journalctl -u craftsapiens-backup -n 50` | Resultado do último backup |
| Ambos | `sudo wg show wg-site` | Estado do túnel (último handshake) |
| VPS | `curl -sI http://10.20.0.2:3000 \| head -1` | Next.js respondendo pelo túnel |
| VPS | `sudo tail -f /var/log/nginx/error.log` | Erros do nginx (inclusive falhas ao alcançar o Next.js) |

### Problemas comuns

| Sintoma | Causa provável | Verificação |
|---------|----------------|-------------|
| Página de manutenção para todos | Next.js parado, túnel caído ou servidor físico fora do ar | `systemctl status craftsapiens-site` (físico), `wg show wg-site` e `curl` para `10.20.0.2:3000` (VPS) |
| Site não sobe depois de reiniciar o servidor físico | Túnel não ativou, e o Next.js não consegue ouvir em `10.20.0.2` | `systemctl status wg-quick@wg-site`; o site sobe sozinho quando o túnel voltar |
| Todas as páginas com erro 500 logo após subir | Variável de ambiente faltando ou com nome antigo | `journalctl -u craftsapiens-site` mostra a lista |
| Login falha para todos, com o banco no ar | Usuário `site_nlogin` com host errado ou sem permissão | Teste com o cliente `mariadb` no servidor físico ([5.2](#52-mariadb-do-pterodactyl-nlogin)) |
| "Muitas tentativas" para todos os visitantes ao mesmo tempo | IP real não está chegando (todos com o IP da Cloudflare) | Conferir `cloudflare-realip.conf` e o `X-Real-IP` no nginx |
| Erros 502 esporádicos, com o site no ar | Next.js fechando conexões antes do nginx | Conferir `--keepAliveTimeout 70000` no serviço ([6.3](#63-serviço-systemd)) |
| Erro 521/522 na Cloudflare | nginx parado, `ufw` ou *Security List* da Oracle bloqueando a Cloudflare, ou VPS recuperada pela Oracle | `systemctl status nginx`, `ufw status`, painel da Oracle ([7.1](#71-instância-e-rede-na-oracle)) |
| Erro 526 na Cloudflare | Certificado de origem inválido ou ausente | Arquivos em `/etc/ssl/cloudflare/` e modo Full (strict) |
| Pagamento aprovado mas pedido continua pendente | Webhook bloqueado ou com secret errado | Painel do MercadoPago (histórico de notificações) e logs `[webhook]` |
| Vídeos novos do canal não aparecem em `/aulas` | yt-dlp desatualizado ou bloqueado pelo YouTube | `journalctl -u craftsapiens-aulas` ([6.5](#65-atualização-automática-das-aulas-youtube)) |

### Monitoramento recomendado

- **Disponibilidade do site:** monitor HTTP externo (ex.: UptimeRobot, gratuito) em `https://craftsapiens.com.br`, com alerta por email ou Discord. A página de manutenção responde `503`, então o monitor detecta a queda.
- **Backups:** conferir semanalmente `rclone ls gdrive-crypt:postgres/` e o log do último backup.
- **Espaço em disco** no servidor físico (volume do Docker e `/var/backups`).

---

## 14. Checklist de validação

Depois da instalação (e após mudanças de infraestrutura):

- [ ] `https://craftsapiens.com.br` abre com cadeado válido.
- [ ] Acessar `https://<IP_PUBLICO_VPS_ENTRADA>` diretamente não funciona (bloqueado pelo `ufw` / `return 444`).
- [ ] `curl -sI https://craftsapiens.com.br` mostra `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options` e não mostra `X-Powered-By`.
- [ ] No servidor físico, `ss -ltnp | grep -E ':5432|:3000'` mostra só `127.0.0.1:5432` e `10.20.0.2:3000`.
- [ ] Com o site parado (`systemctl stop craftsapiens-site`), o domínio mostra a página de manutenção com status `503`; depois, subir o site de novo.
- [ ] Login no site funciona com uma conta do jogo, e a mesma senha continua valendo no servidor de Minecraft.
- [ ] Cadastro de conta nova funciona e a conta consegue entrar no jogo.
- [ ] Seis tentativas de login erradas na mesma conta retornam "Muitas tentativas" só para quem tentou.
- [ ] Compra de teste com credenciais de teste do MercadoPago (Pix e cartão): pedido vai para APPROVED, a entrega aparece em `deliveries` e o email de confirmação chega.
- [ ] Reenviar o mesmo webhook (painel do MercadoPago) não baixa o estoque nem cria entrega de novo.
- [ ] Plugin da loja busca a entrega (`GET /api/loja/entregas` responde 200 com o token) e o grupo aparece em `/lp user <nick> info`.
- [ ] Backup aparece no Google Drive e a restauração de teste funciona.
- [ ] Após reiniciar o servidor físico, túnel, PostgreSQL e site voltam sozinhos.
- [ ] Após reiniciar a VPS de entrada, `ufw`, nginx e túnel voltam sozinhos.

---

## 15. Pendências de código para esta arquitetura

Estes ajustes são recomendados e ainda não foram implementados:

| Ajuste | Benefício |
|--------|-----------|
| Timeouts de conexão nos clientes PostgreSQL e MariaDB (`src/lib/prisma.ts`) | Se um banco travar, as páginas falham em poucos segundos em vez de ficarem presas |
| Cache de 60 s nas APIs públicas (`/api/loja/produtos`, `/api/ranking`, `/api/estatisticas`) | Menos carga no servidor físico, que divide CPU com os servidores de Minecraft |
| Página de manutenção do próprio site quando um banco estiver inacessível | O nginx já cobre o Next.js fora do ar; falta o caso do site no ar com o banco parado, que hoje dá erro 500 |
| Rota de health check (`/api/health`) testando os dois bancos | Monitoramento externo detecta queda de banco, não só do site |
