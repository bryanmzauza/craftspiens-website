# Plugin de entregas da loja (CraftSapiensLoja)

Este documento é o briefing completo para desenvolver o plugin que entrega as compras do site no servidor Minecraft. Pode ser entregue como está a quem for programar: tem o contexto da rede, o contrato da API do site, o que cada produto deve virar no jogo, a especificação dos cosméticos e os critérios de aceite.

Divisão de responsabilidades:

- **Site**: recebe o pagamento, confirma que a conta do jogo existe no nLogin e se é Java ou Bedrock, e coloca cada item aprovado em uma fila de entregas (o quê, quanto, para quem).
- **Plugin (instalado em todos os servidores Paper da rede)**: o mesmo jar em todos. Em todos ele gera os cosméticos. Só no lobby, onde fica a configuração da API, ele também busca a fila, executa os comandos (grupos e permissões do LuckPerms, Sapiens), avisa o jogador e confirma o resultado. Como o LuckPerms é compartilhado por toda a rede, planos e cosméticos aplicados no lobby valem na hora em todos os servidores, esteja o jogador onde estiver. Só os Sapiens dependem de o jogador estar no lobby.

---

## 1. Prompt para o desenvolvimento

> Copie daqui até o fim do documento.

Você vai desenvolver um plugin para Paper chamado **CraftSapiensLoja**, em Java 21, para a rede de servidores Minecraft da CraftSapiens (um projeto educacional brasileiro). O plugin é instalado em todos os servidores Paper da rede: em todos ele gera os cosméticos, e no **lobby** também entrega automaticamente as compras feitas no site: planos VIP e Premium (mensais e anuais, e combos do plano mensal com cosméticos por 30 dias), moedas Sapiens e cosméticos. Também implementa os cosméticos vendidos. Todas as mensagens para jogadores são em português do Brasil, sem emojis.

### 1.1 Contexto da rede

- Proxy **Velocity** com vários servidores Paper por trás (`lobby`, `survival`, `vanilla`, `craftsapiens`, `geopolitico2`, `colegiojp`). Todo jogador entra pelo lobby. O plugin é instalado **em todos os servidores Paper** (não no Velocity). As entregas ficam ligadas **só no lobby** (`api.enabled: true` e o token); nos outros servidores a config fica no padrão (`api.enabled: false`) e o plugin roda apenas os cosméticos.
- Trocar de servidor pelo Velocity dispara `PlayerJoinEvent` no Paper de destino. Logo, quando um jogador volta ao lobby vindo de outro servidor, o lobby trata como uma entrada normal.
- **LuckPerms** em todos os servidores, com armazenamento **MySQL compartilhado** e messenger SQL: um comando `lp` executado no console do lobby vale para a rede inteira em segundos, inclusive com o jogador offline. Grupos dos planos: `vip` e `premium` (ambos com `weight.30`; o prefixo do Premium tem prioridade maior). Os planos usam tempo acumulado: renovar soma ao prazo que falta.
- Jogadores entram pelo **Java** e pelo **Bedrock** (Geyser + Floodgate). O servidor usa **nLogin** (modo offline): o UUID do jogador no jogo é o `unique_id` do nLogin. O site envia, em cada entrega, o nick, esse UUID com hífens, a edição (`java` ou `bedrock`) e, quando existem, o `mojangId` (conta Java original) e o `bedrockId` (UUID do Floodgate).
- Economia: MiyukiEconomy (moeda "Sapiens"), sincronizada entre os servidores. O crédito de moedas é feito **no lobby** e precisa do jogador online nele. **Confirme o comando exato no console antes de implementar** (algo como `sapiens give <nick> <valor>`); deixe-o configurável.
- Dependências: Paper API; **LuckPerms API** (obrigatória, `compileOnly`, presente em todos os servidores), usada para ler e gravar as preferências de cosméticos da seção 1.7; e, opcionalmente, Floodgate API (soft-depend) para informar a edição no comando de status. As entregas continuam usando comandos `lp` no console, não a API.

### 1.2 O que o plugin faz

1. **Busca entregas pendentes** no site a cada `poll-interval` segundos (padrão 15) e **imediatamente quando um jogador entra** no lobby (enviando o UUID dele em `online`).
2. **Traduz cada entrega em comandos** conforme a tabela da seção 1.4 e os executa no console (`Bukkit.dispatchCommand(Bukkit.getConsoleSender(), ...)`), na thread principal, um de cada vez.
3. **Confirma o resultado** no site: sucesso, falha com motivo, ou "aguardar o jogador" quando o item precisa dele no lobby (Sapiens) e ele não está.
4. **Avisa o jogador** se ele estiver no lobby: mensagem no chat e som curto (`ENTITY_PLAYER_LEVELUP`). Se ele estiver em outro servidor ou offline, guarda o aviso em `avisos.yml` (no lobby) e mostra na próxima vez que ele entrar no lobby.
5. **Implementa os cosméticos** (seção 1.7).
6. Oferece comandos de administração para ver a fila e forçar uma busca.

### 1.3 Contrato da API do site

Base: `https://craftsapiens.com.br` (configurável). Todas as chamadas levam `Authorization: Bearer <token>`. O token vem do `.env` do site (`DELIVERY_API_TOKEN`) e nunca deve aparecer em logs.

#### Buscar e reservar entregas

```
GET /api/loja/entregas?servidor=lobby&online=<uuid1>,<uuid2>&limite=20
```

| Parâmetro | Obrigatório | Descrição |
|-----------|:-----------:|-----------|
| `servidor` | Sim | Nome deste servidor (`server-name` da config): letras minúsculas, números, `-` e `_`. Fica registrado em cada entrega como quem a executou |
| `online` | Não | UUIDs (com hífens) dos jogadores online, separados por vírgula. Entregas que o plugin **adiou até o jogador entrar** só são devolvidas se o UUID dele estiver aqui. Envie sempre a lista completa |
| `limite` | Não | Máximo de entregas por chamada (1 a 50, padrão 20) |

Resposta `200`:

```json
{
  "servidor": "lobby",
  "entregas": [
    {
      "id": "cmg1x2y3z0000abcd",
      "pedido": "cmg1x2y3z0000wxyz",
      "tipo": "entrega",
      "jogador": {
        "nick": "brmz",
        "uuid": "75d23417-1682-358f-ae3a-a43c3cafacd1",
        "plataforma": "java",
        "mojangId": null,
        "bedrockId": null
      },
      "produto": {
        "slug": "vip",
        "nome": "VIP",
        "categoria": "vip",
        "quantidade": 1,
        "dias": 30
      },
      "aguardandoJogador": false,
      "tentativa": 1,
      "criadaEm": "2026-10-10T21:15:02.000Z"
    }
  ]
}
```

- `tipo` é `"entrega"` (compra aprovada) ou `"estorno"` (pagamento devolvido: remova o benefício).
- `jogador.plataforma` é `"java"` ou `"bedrock"`. `mojangId` vem preenchido para contas Java originais; `bedrockId` (UUID do Floodgate, sem hífens) para contas Bedrock. Para o LuckPerms use sempre `jogador.uuid`, que é o UUID que o servidor vê.
- `produto.categoria` é `vip` (planos), `moeda` (Sapiens) ou `cosmetico`. `dias` vem só nos planos.
- Ao devolver uma entrega, o site a marca como **reservada**. Se o plugin não confirmar em **10 minutos**, ela volta para a fila.
- Respostas: `401` token inválido; `503` API desligada no site (sem `DELIVERY_API_TOKEN`); `400` parâmetro inválido. Em qualquer erro, registre no log (sem o token) e tente de novo no próximo ciclo.

#### Confirmar o resultado

```
POST /api/loja/entregas/<id>
Content-Type: application/json

{ "servidor": "lobby", "ok": true }
{ "servidor": "lobby", "ok": false, "erro": "Comando desconhecido: sapiens" }
{ "servidor": "lobby", "ok": false, "aguardarJogador": true, "erro": "Jogador offline" }
```

| Resposta do plugin | O que o site faz |
|--------------------|------------------|
| `ok: true` | Marca como entregue |
| `ok: false` | Volta para a fila; depois de 5 falhas vira `FAILED` (revisão manual) |
| `ok: false, aguardarJogador: true` | Volta para a fila **sem contar tentativa** e só sai de novo quando o UUID do jogador vier em `online` |

Resposta `200` `{ "ok": true }`; `404` entrega desconhecida (registre e siga).

### 1.4 O que cada produto vira no jogo

O site só informa o `slug`. O plugin mapeia assim (mantenha em um `products.yml` para ajustar sem recompilar):

| `produto.slug` | Entrega | Estorno |
|----------------|---------|---------|
| `vip` | `lp user {uuid} parent addtemp vip {dias}d accumulate` | `lp user {uuid} parent removetemp vip {dias}d` |
| `premium` | `lp user {uuid} parent addtemp premium {dias}d accumulate` | `lp user {uuid} parent removetemp premium {dias}d` |
| `vip-anual` | `lp user {uuid} parent addtemp vip {dias}d accumulate` (dias = 365) | `lp user {uuid} parent removetemp vip {dias}d` |
| `premium-anual` | `lp user {uuid} parent addtemp premium {dias}d accumulate` (dias = 365) | `lp user {uuid} parent removetemp premium {dias}d` |
| `vip-cosmeticos` | o mesmo de `vip` e, para cada permissão de cosmético da seção 1.6 (os 4 rastros e a Entrada Épica), `lp user {uuid} permission settemp <permissão> true {dias}d accumulate` (dias = 30) | `parent removetemp vip {dias}d` e `permission unsettemp <permissão> {dias}d` para cada cosmético |
| `premium-cosmeticos` | o mesmo de `premium` e as 5 permissões temporárias, como acima | `parent removetemp premium {dias}d` e `permission unsettemp <permissão> {dias}d` para cada cosmético |
| `sapiens-1m` | creditar 1.000.000 Sapiens (jogador precisa estar online) | nada (o site não estorna moedas já gastas) |
| `sapiens-3m` | creditar 3.000.000 Sapiens | nada |
| `sapiens-20m` | creditar 20.000.000 Sapiens | nada |
| `rastro-chamas` | `lp user {uuid} permission set craftsapiens.rastro.chamas true` | `lp user {uuid} permission unset craftsapiens.rastro.chamas` |
| `rastro-coracoes` | `lp user {uuid} permission set craftsapiens.rastro.coracoes true` | `permission unset ...` |
| `rastro-notas` | `lp user {uuid} permission set craftsapiens.rastro.notas true` | `permission unset ...` |
| `rastro-estrelas` | `lp user {uuid} permission set craftsapiens.rastro.estrelas true` | `permission unset ...` |
| `entrada-epica` | `lp user {uuid} permission set craftsapiens.entrada.epica true` | `permission unset ...` |

Regras:

- `{uuid}` é `jogador.uuid`; `{nick}` é `jogador.nick`; `{dias}` é `produto.dias`; `{quantidade}` é `produto.quantidade` (hoje sempre 1).
- Um slug pode ter **vários comandos** (os combos): no `products.yml`, `entrega` e `estorno` são listas executadas em ordem. Se um comando falhar, pare, responda `ok: false` com o comando que falhou e registre localmente quais comandos já rodaram (ver "Nunca entregar duas vezes"); na nova tentativa, continue do comando que falhou.
- O estorno de plano usa `removetemp` com a duração: tira só os dias daquela compra e mantém o que o jogador comprou em outros pedidos. **Confirme no console** que a versão do LuckPerms aceita a duração em `parent removetemp` e `permission unsettemp`; sem esse suporte, o comando remove o grupo ou a permissão temporária inteira.
- Os cosméticos dos combos são permissões **temporárias** (`settemp`), independentes das permanentes (`set`) vendidas separado: quem já tem o rastro permanente e compra o combo continua com ele depois dos 30 dias, e o estorno do combo (`unsettemp`) não remove o permanente.
- Planos e cosméticos **não dependem de onde o jogador está**: execute assim que receber, com ele no lobby, em outro servidor da rede ou offline. O LuckPerms propaga para a rede inteira. Se ele estiver no lobby, avise no chat; senão, guarde o aviso para a próxima entrada no lobby.
- Sapiens **só são entregues no lobby**: se `Bukkit.getPlayer(uuid)` for nulo (offline ou em outro servidor), responda `ok: false, aguardarJogador: true` sem executar nada. Quando ele entrar no lobby, a busca do `PlayerJoinEvent` (com o UUID em `online`) traz a entrega de volta. Se `server-name` não for `lobby`, nunca execute Sapiens: responda `aguardarJogador: true`.
- Slug desconhecido: responda `ok: false` com `Produto desconhecido: <slug>` e registre em WARN. Nunca invente um comando.
- `dispatchCommand` devolvendo `false` significa comando inexistente: `ok: false` com `Comando desconhecido: <comando>`.
- Nunca execute comandos fora da thread principal. HTTP assíncrono (`java.net.http.HttpClient` com `sendAsync`, ou o scheduler assíncrono do Paper), resultados devolvidos para a thread principal com `Bukkit.getScheduler().runTask(...)`.
- Timeout de 10 s por requisição; não acumule ciclos (se uma busca ainda está em andamento, pule).
- Log INFO por entrega: `Entrega <id> (<slug>) para <nick> [<plataforma>]: OK` ou `FALHA: <motivo>`. Nunca logue o token.

**Nunca entregar duas vezes.** O site devolve para a fila toda reserva que não for confirmada em 10 minutos. Se o plugin executar os comandos e a confirmação não chegar (site fora do ar, servidor reiniciado no meio), a mesma entrega volta. Como os planos usam `accumulate` e os Sapiens somam saldo, executar de novo daria dias ou moedas em dobro. Por isso:

- Mantenha um registro local em `plugins/CraftSapiensLoja/entregas.yml`, por `id` de entrega: quantos comandos já rodaram e se terminou. Grave o progresso **logo após cada comando**, antes de seguir para o próximo e antes de confirmar no site (escrita síncrona do arquivo, na thread principal).
- Ao receber uma entrega já marcada como terminada, não execute nada: só reenvie `ok: true`. Se estiver pela metade, continue do primeiro comando que não rodou.
- Se o `POST` de confirmação falhar, guarde a confirmação pendente e reenvie no próximo ciclo, antes de buscar novas entregas.
- Apague do registro as entregas confirmadas há mais de 30 dias.

### 1.5 Configuração (`config.yml`)

```yaml
api:
  # Padrão false. Mude para true só no lobby; nos outros servidores o plugin roda apenas os cosméticos
  enabled: false
  url: "https://craftsapiens.com.br"
  token: "COLE_AQUI_O_DELIVERY_API_TOKEN"
# Nome deste servidor na rede (igual ao nome no Velocity)
server-name: "lobby"
# Intervalo da busca periódica, em segundos
poll-interval: 15
# Máximo de entregas por busca (1 a 50)
batch-size: 20
# Buscar entregas quando um jogador entra
check-on-join: true
check-on-join-delay-ticks: 40
# Comando que credita Sapiens; confirme no console antes de usar
sapiens-command: "sapiens give {nick} {valor}"
cosmetics:
  trails:
    enabled: true
    interval-ticks: 3
    only-when-moving: true
  join-effect:
    enabled: true
    cooldown-seconds: 300
```

Todos os textos para jogadores ficam em `messages.yml` (não no `config.yml`), por exemplo:

```yaml
delivered: "&a[Loja] &fSua compra &e{nome} &ffoi entregue. Obrigado por apoiar a CraftSapiens!"
sapiens-delivered: "&a[Loja] &fSeus Sapiens foram creditados: &e{nome}&f."
pending-notice: "&a[Loja] &fEnquanto você estava fora, sua compra &e{nome} &ffoi ativada."
sapiens-waiting: "&a[Loja] &fVocê tem Sapiens para receber: &e{nome}&f. Eles serão creditados agora."
join-broadcast: "&6[Entrada Épica] &e{player} &fchegou ao servidor!"
```

O jar instalado sem mexer na config (padrão `api.enabled: false`) deve funcionar como servidor só de cosméticos, sem avisos no log. Com `api.enabled: true`, valide `server-name` com `^[a-z0-9_-]{1,50}$` ao carregar; se o token estiver vazio, desligue só a parte de entregas (os cosméticos continuam) e registre uma mensagem clara no log.

### 1.6 Comandos e permissões

| Comando | Permissão | Descrição |
|---------|-----------|-----------|
| `/loja` | nenhuma | Mostra o link `https://craftsapiens.com.br/loja` e um resumo (planos, Sapiens, cosméticos) |
| `/rastro [nome\|off]` | nenhuma | Menu (inventário de 27 slots) com os rastros que o jogador possui; com argumento, ativa ou desliga direto |
| `/entrada [on\|off]` | nenhuma | Liga ou desliga a Entrada Épica de quem a possui |
| `/lojaadmin status` | `craftsapiens.loja.admin` | Config carregada (sem o token), último ciclo, entregas da sessão, falhas, jogadores Java e Bedrock online |
| `/lojaadmin buscar` | `craftsapiens.loja.admin` | Força uma busca agora |
| `/lojaadmin reload` | `craftsapiens.loja.admin` | Recarrega `config.yml`, `products.yml` e `messages.yml` |

Permissões dos cosméticos (aplicadas pelo próprio plugin via LuckPerms; o módulo de cosméticos só lê):

| Permissão | Cosmético |
|-----------|-----------|
| `craftsapiens.rastro.chamas` | Rastro de Chamas |
| `craftsapiens.rastro.coracoes` | Rastro de Corações |
| `craftsapiens.rastro.notas` | Rastro de Notas Musicais |
| `craftsapiens.rastro.estrelas` | Rastro de Estrelas |
| `craftsapiens.rastro.*` | Todos os rastros (equipe) |
| `craftsapiens.entrada.epica` | Entrada Épica |

### 1.7 Cosméticos: especificação

Os cosméticos precisam funcionar para jogadores Java e Bedrock. No Bedrock (via Geyser) só aparecem partículas que o Geyser traduz, e não existe o efeito de brilho (glow). Por isso a loja vende apenas rastros de partículas e um efeito de entrada. Os cosméticos rodam em todos os servidores da rede, e as escolhas do jogador valem na rede toda: ele ativa um rastro no lobby e continua com ele no `survival`.

**Rastros (trails)**

- A cada `interval-ticks`, para cada jogador online com um rastro ativo e permissão para ele, emitir partículas nos pés (`player.getLocation().add(0, 0.1, 0)`), visíveis para todos (`world.spawnParticle`).
- Com `only-when-moving`, não emitir se o jogador não mudou de bloco desde a última emissão, está agachado, voando parado, em modo espectador ou invisível.
- Mapeamento, só com partículas que o Geyser traduz:

| Rastro | Partícula (Paper 1.21) | Quantidade | Dispersão |
|--------|------------------------|:----------:|-----------|
| chamas | `Particle.FLAME` | 3 | 0.2, 0.05, 0.2, velocidade 0 |
| coracoes | `Particle.HEART` | 1 | 0.3, 0.2, 0.3 |
| notas | `Particle.NOTE` | 2 | 0.3, 0.2, 0.3 (cor pelo `offsetX` aleatório 0 a 1, com `count = 0`) |
| estrelas | `Particle.END_ROD` | 2 | 0.2, 0.1, 0.2, velocidade 0.01 |

- A escolha fica salva como **meta do LuckPerms** do jogador (`craftsapiens.rastro` = `chamas`, `coracoes`, `notas`, `estrelas` ou ausente), lida com `user.getCachedData().getMetaData().getMetaValue(...)` e gravada pela API (`MetaNode`, substituindo o valor anterior). Como o LuckPerms usa MySQL com messenger, a escolha chega aos outros servidores sem arquivo local nem sincronização própria. Não use arquivo por servidor para isso.
- Se o jogador perder a permissão (estorno ou fim do combo), o rastro para de aparecer sozinho, porque a checagem de permissão é feita a cada emissão.
- O menu de `/rastro` mostra um item por rastro (`BLAZE_POWDER`, `POPPY`, `NOTE_BLOCK`, `END_ROD`), com o nome e, para os que o jogador não tem, "Disponível na loja: craftsapiens.com.br/loja". Um item `BARRIER` desliga. Menus de inventário funcionam no Bedrock sem adaptação.

**Entrada Épica**

- `/entrada off` grava a meta `craftsapiens.entrada` = `off` no LuckPerms (vale na rede toda); `/entrada on` remove a meta.
- No `PlayerJoinEvent` (depois de 20 ticks), se tiver `craftsapiens.entrada.epica`, não tiver a meta `off` e não tiver disparado neste servidor nos últimos `join-effect.cooldown-seconds` (padrão 300, para quem troca de servidor várias vezes): lança um foguete (`Firework`) na posição do jogador com `FireworkEffect` tipo `BALL_LARGE`, cores aleatórias entre verde `#4CAF50`, amarelo `#FFEB3B` e branco, `power 0`, detonando no tick seguinte (`detonate()`), e envia a mensagem `join-broadcast` (de `messages.yml`) para todos no servidor.
- O foguete não dá dano: marque a entidade com `PersistentDataContainer` e cancele o `EntityDamageByEntityEvent` quando o causador for um foguete do plugin.
- Fogos e mensagens funcionam normalmente no Bedrock.

**Detecção de Bedrock (opcional)**

Se o Floodgate estiver presente, use `FloodgateApi.getInstance().isFloodgatePlayer(uuid)` apenas para o `/lojaadmin status`. Nenhum cosmético precisa de comportamento diferente por edição; a edição já vem do site em cada entrega.

### 1.8 Estrutura do projeto

- Gradle (Kotlin DSL), Java 21, `io.papermc.paper:paper-api:1.21.x-R0.1-SNAPSHOT` (`compileOnly`), plugin `run-paper` para testes locais, `net.luckperms:api:5.4` (`compileOnly`), `paper-plugin.yml` com `api-version: "1.21"`, `LuckPerms` como dependência obrigatória e `floodgate` como opcional.
- Sem shading: `com.google.gson` (incluído no Paper) para JSON e `java.net.http.HttpClient` para HTTP.
- Pacotes sugeridos: `br.com.craftsapiens.loja` com `LojaPlugin`, `api/LojaApiClient`, `entrega/EntregaService`, `entrega/ProdutoMapa` (lê `products.yml`), `entrega/RegistroEntregas` (lê e grava `entregas.yml`), `entrega/EntregaListener`, `cosmeticos/RastroService`, `cosmeticos/RastroMenu`, `cosmeticos/EntradaEpica`, `comandos/*`, `config/LojaConfig`.
- Mensagens em `messages.yml` com cores no formato `&`, convertidas com o Adventure API do Paper (`LegacyComponentSerializer`).

### 1.9 Testes e aceite

Para testar sem o site, suba um servidor HTTP local que responda ao contrato (um script Node ou Python de 40 linhas basta) e aponte `api.url` para ele. Critérios de aceite:

1. Entrega de `vip` na fila: o plugin executa `lp user <uuid> parent addtemp vip 30d accumulate` em até um ciclo e confirma `ok: true`; o grupo aparece em `/lp user <nick> info` em qualquer servidor da rede.
2. Entrega de `premium-anual`: `addtemp premium 365d accumulate`. Comprar de novo soma os dias em vez de substituir. Entrega de `vip-cosmeticos`: grupo `vip` por 30 dias e as 5 permissões de cosmético temporárias por 30 dias; os rastros aparecem em `/rastro`. Para quem já tinha `rastro-chamas` permanente, o estorno do combo mantém o rastro.
3. Entrega de `sapiens-3m` com o jogador offline: o plugin responde `aguardarJogador: true` sem executar; quando o jogador entra no lobby, a busca do `PlayerJoinEvent` a recebe e credita; o jogador vê a mensagem.
4. Entrega para um jogador `bedrock`: o `lp user <uuid>` usa o UUID enviado pelo site e o grupo aparece para ele no jogo.
5. Estorno de `vip`: `parent removetemp vip 30d` (o tempo de outras compras continua); estorno de `rastro-chamas`: `permission unset`, e o rastro desliga sozinho se estiver ativo.
6. Slug desconhecido e comando inexistente geram `ok: false` com o motivo e não travam a fila.
7. Site fora do ar ou `503`: um aviso por ciclo (sem repetir a cada segundo) e o plugin continua tentando.
8. Rastro de Chamas visível para um jogador Java e um Bedrock andando lado a lado; `/rastro off` desliga.
9. Entrada Épica lança fogos sem dano e envia a mensagem; `/entrada off` desliga para aquele jogador.
10. `/lojaadmin status` nunca mostra o token.
11. Jogador no `survival` compra `vip`: o lobby aplica o grupo na hora e ele ganha o prefixo no `survival` sem trocar de servidor. Ao entrar no lobby depois, vê a mensagem `pending-notice`.
12. Jogador no `survival` compra `sapiens-1m`: nada é creditado até ele ir para o lobby; ao entrar no lobby, recebe o crédito uma única vez.
13. Entrega duplicada: com o servidor de teste respondendo `500` ao `POST` de confirmação, o plugin executa a entrega uma vez, reenvia a confirmação nos ciclos seguintes e, quando o servidor de teste devolve a mesma entrega de novo, não executa os comandos outra vez. O mesmo vale depois de reiniciar o servidor.
14. Combo com o terceiro comando falhando: na nova tentativa, os dois primeiros não rodam de novo.
15. Rastro ativado no lobby continua ativo ao ir para o `survival`; `/rastro off` no `survival` desliga também no lobby.
16. Jar instalado num servidor com a config padrão: cosméticos funcionam, nenhuma chamada ao site e nenhum aviso no log.

Entregáveis: código-fonte com `build.gradle.kts`, `config.yml`, `products.yml` e `messages.yml` padrão, um `README.md` curto com instalação (copiar o jar em todos os servidores Paper; só no lobby, ligar `api.enabled`, preencher o token e o `server-name` e confirmar `sapiens-command`; reiniciar) e o jar compilado.

---

## 2. Operação (lado do site)

- Gere o token com `openssl rand -hex 32`, coloque em `DELIVERY_API_TOKEN` no `.env` do site e no `config.yml` do plugin; reinicie o site.
- Sem o token no site, `GET /api/loja/entregas` responde `503` e os pedidos aprovados ficam na fila (status `PENDING` na tabela `deliveries`) até o plugin voltar.
- Antes de aceitar um pedido, o site confere que a conta do jogo existe no nLogin (`unique_id` preenchido) e registra a edição (Java ou Bedrock) na entrega. Conta vinculada que não existe mais no servidor recebe o código `ContaJogoNaoEncontrada`.
- A tabela `deliveries` guarda status, servidor que executou, tentativas e o último erro. Entregas `FAILED` precisam de ação manual (executar o comando no console e atualizar o status, ou voltar o status para `PENDING`).
- Os slugs dos produtos estão em `scripts/seed-loja.mjs` e precisam bater com o `products.yml` do plugin.
