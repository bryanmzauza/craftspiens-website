# 📜 Página 12 — Termos e Condições / Política de Privacidade

> **Rotas**: `/termos`, `/privacidade`
> **Acesso**: Público
> **Propósito**: Exibir os termos de uso, regras do servidor e política de privacidade.

---

## Regras de Negócio

### RN-TERMOS-01: Página de Termos e Condições (`/termos`)

#### Hero
- Título: **"TERMOS E CONDIÇÕES"** em fonte Minecraft
- Breadcrumb: Home > Termos e Condições
- Data da última atualização em destaque

#### Conteúdo
O conteúdo deve ser organizado em seções com navegação lateral (table of contents):

1. **Da Adesão**
   - A adesão ao termo ocorre no momento do registro
   - Incapazes/relativamente incapazes: presume-se que registro foi acompanhado por responsáveis

2. **Regras de Conduta**
   - Jogador deve seguir regras de conduta do servidor
   - Proibido comportamento ofensivo, discriminatório, vexatório, de má índole
   - Total responsabilidade por ações dentro do servidor e canais relacionados
   - Administração se exime de responsabilidade sobre atitudes de terceiros
   - Regras detalhadas disponíveis no Discord

3. **Punições**
   - Violações podem resultar em: confisco de itens, mute, banimento, reclusão
   - Decisão da administração é soberana
   - Apelação via email: contato@craftsapiens.com.br
   - Se apelação negada: não cabe mais recurso
   - Tentativa de burlar banimento = violação dos termos

4. **Premium / VIP**
   - Premium é uma distinção por contribuição financeira
   - Valores pré-definidos, contribuição espontânea
   - Contrapartidas podem sofrer alterações/remoção com 7 dias de aviso
   - Remoção de benefícios não justifica reembolso

5. **Da Contribuição**
   - Idade mínima: 16 anos (menores devem ter responsável)
   - Servidor não se responsabiliza por compras feitas por menores

6. **Estorno / Reembolso**
   - Se já usufruiu dos benefícios: não haverá reembolso
   - Chargeback = banimento permanente
   - Contato prévio obrigatório antes de estorno
   - Estorno unilateral pela administração: valor devolvido + conta banida

7. **Distinções de Tratamento**
   - VIP não isenta de punições
   - Se banido por culpa própria: sem restituição

8. **Dados e Privacidade**
   - Todas as interações são registradas (conversas, ações, etc.)
   - Jogador anui com coleta e visualização pela administração

9. **Da Moeda SAPIENS**
   - Moeda virtual SEM valor real fora do servidor
   - Não pode ser trocada por moeda real ou produtos reais

10. **Manutenção do Servidor**
    - Manutenções programadas: aviso no Discord
    - Manutenções eventuais: aviso in-game com 1 min de antecedência
    - Perda de itens durante manutenção: sem obrigação de devolução
    - Rollback possível em caso de erro grave

11. **Hierarquia da Equipe**
    - Reitor, Diretor, Administradores, Moderadores, Ajuda, Professores
    - Equipe é voluntária
    - Poderes da administração: acesso a inventário, baús, terrenos, teletransporte, etc.

12. **Ouvidoria**
    - Canal via email: contato@craftsapiens.com.br
    - Prazo de resposta: 15 dias corridos
    - Jogador deve contatar servidor antes de buscar outros meios

13. **Encerramento das Atividades**
    - Em caso de encerramento: aviso com 30 dias de antecedência
    - Contribuições não aceitas no período final

#### Funcionalidades da Página
- **Table of Contents**: Navegação lateral fixa (desktop) / dropdown (mobile)
- **Busca no documento**: Ctrl+F estilizado para buscar seções
- **Scroll spy**: Highlight na seção ativa no ToC
- **Versão para impressão**: Botão para versão printer-friendly
- **Aceite**: Checkbox nos formulários de registro/checkout referenciando esta página

### RN-TERMOS-02: Política de Privacidade (`/privacidade`)

#### Conteúdo
1. **Dados Coletados**
   - Username, email, data de nascimento, IP
   - Dados de uso: páginas visitadas, cliques, tempo de permanência
   - Dados do servidor: logs de chat, ações, inventário
   - Dados de pagamento: processados pelo MercadoPago (não armazenamos dados de cartão)

2. **Uso dos Dados**
   - Autenticação e gerenciamento de conta
   - Entrega de produtos comprados
   - Comunicações (email, notificações)
   - Moderação e segurança do servidor
   - Melhoria dos serviços

3. **Compartilhamento**
   - Não vendemos dados pessoais
   - Compartilhamos apenas com: processadores de pagamento, serviços de email
   - Em caso de obrigação legal

4. **Cookies**
   - Cookies de sessão (autenticação)
   - Cookies de preferência (tema, idioma)
   - Cookies analíticos (opcional, com consentimento)

5. **Direitos do Usuário** (LGPD)
   - Acesso aos dados pessoais
   - Correção de dados incorretos
   - Exclusão de dados (direito ao esquecimento)
   - Portabilidade
   - Revogação de consentimento
   - Contato do encarregado: contato@craftsapiens.com.br

6. **Segurança**
   - Senhas armazenadas com hash bcrypt
   - Comunicação via HTTPS
   - Acesso restrito ao banco de dados

7. **Menores de Idade**
   - Menores de 13 anos não podem criar conta
   - 13-17 anos: responsabilidade dos pais/responsáveis

8. **Alterações**
   - Notificação com 7 dias de antecedência
   - Versão anterior fica disponível para consulta

---

## Wireframe Textual

```
┌──────────────────────────────────────────────────────────────────┐
│ [NAVBAR]                                                          │
├──────────────────────────────────────────────────────────────────┤
│  Home > Termos e Condições                                         │
│                                                                    │
│  ████████████████████████████████                                  │
│  █  TERMOS E CONDIÇÕES         █                                  │
│  ████████████████████████████████                                  │
│  Última atualização: 19/03/2026                                    │
│                                                                    │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌────────────────┐  ┌─────────────────────────────────────┐      │
│  │ Table of       │  │                                     │      │
│  │ Contents       │  │  1. DA ADESÃO                       │      │
│  │                │  │                                     │      │
│  │ ● Da Adesão   │  │  A adesão ao presente termo         │      │
│  │ ○ Regras      │  │  far-se-á no momento do registro    │      │
│  │ ○ Punições    │  │  em nosso servidor...               │      │
│  │ ○ Premium     │  │                                     │      │
│  │ ○ Contribuição│  │  2. REGRAS DE CONDUTA               │      │
│  │ ○ Estorno     │  │                                     │      │
│  │ ○ Dados       │  │  O jogador se compromete a seguir   │      │
│  │ ○ Moeda       │  │  as regras de conduta do servidor,  │      │
│  │ ○ Manutenção  │  │  evitando comportamentos...         │      │
│  │ ○ Equipe      │  │                                     │      │
│  │ ○ Ouvidoria   │  │  ...                                │      │
│  │ ○ Encerramento│  │                                     │      │
│  │                │  │                                     │      │
│  │ [🖨️ Imprimir] │  │                                     │      │
│  └────────────────┘  └─────────────────────────────────────┘      │
│                                                                    │
│  [Termos e Condições ✓] [Política de Privacidade →]               │
│                                                                    │
├──────────────────────────────────────────────────────────────────┤
│ [FOOTER]                                                           │
└──────────────────────────────────────────────────────────────────┘
```

---

## SEO

| Meta | Valor |
|------|-------|
| **Title (Termos)** | Termos e Condições — CraftSapiens |
| **Title (Privacidade)** | Política de Privacidade — CraftSapiens |
| **Description** | Leia os termos e condições e a política de privacidade da CraftSapiens. Regras do servidor, contribuições VIP, dados pessoais e seus direitos. |

---

## Responsividade

| Breakpoint | Comportamento |
|------------|---------------|
| **Desktop** | Table of Contents na sidebar esquerda fixa (sticky) |
| **Tablet** | ToC colapsa em botão flutuante |
| **Mobile** | ToC como dropdown no topo, scroll-to-section |
