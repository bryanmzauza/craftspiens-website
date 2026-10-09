# 📝 Padrão de Commits

Padrão usado no histórico do projeto desde a v0.1. Cada commit corresponde a uma versão registrada no [CHANGELOG](../CHANGELOG.md).

---

## Formato

```
[vX.Y] Resumo da versão

- Mudança principal 1
- Mudança principal 2
```

### Título (obrigatório)

| Regra | Exemplo |
|-------|---------|
| Começa com a versão entre colchetes | `[v0.14]`, `[v0.4.1]` |
| Resumo em português, com a primeira letra maiúscula | `[v0.8] Sistema de email, recuperação de senha e newsletter` |
| Descreve **o que** a versão entrega, não como foi feito | ✅ `Checkout com MercadoPago` · ❌ `Ajustes no route.ts` |
| Até 72 caracteres, sem ponto final | |
| Mesmo resumo do título da versão no CHANGELOG | `## [v0.14] — … — Higienização pré-produção e segurança` |

### Corpo (opcional)

- Separado do título por uma linha em branco.
- Lista com `- ` das mudanças mais importantes (o detalhe completo fica no CHANGELOG).
- Linhas de até 72 caracteres.

---

## Versionamento

O projeto segue o [Versionamento Semântico](https://semver.org/lang/pt-BR/) enquanto está em `0.x`:

| Tipo de mudança | Versão | Exemplo |
|-----------------|--------|---------|
| Nova funcionalidade ou conjunto de mudanças | `v0.Y` (minor) | `[v0.13] Migração para PostgreSQL (dual database)` |
| Correção ou ajuste pontual sobre uma versão | `v0.Y.Z` (patch) | `[v0.4.1] Integração nLogin-Web multi-algoritmo` |
| Primeira versão estável em produção | `v1.0` | `[v1.0] Lançamento em produção` |

A versão do título deve ser a mesma em três lugares:

1. Título do commit
2. Entrada no `CHANGELOG.md`
3. Campo `version` do `package.json` (`npm version 0.Y.0 --no-git-tag-version`)

---

## Checklist antes de commitar

- [ ] `npm run typecheck` sem erros
- [ ] `npm run lint` sem erros nem avisos
- [ ] `npm run build` passa
- [ ] Entrada da versão adicionada no topo do `CHANGELOG.md`
- [ ] `version` do `package.json` atualizada
- [ ] Nenhum arquivo sensível no commit: `.env`, dumps (`*.sql`, `*.dump`), chaves (`*.pem`, `*.key`) ou clientes gerados (`src/generated/`)
- [ ] Nenhum dado pessoal, credencial, host ou porta de servidor de produção no código, na documentação ou no CHANGELOG

---

## Exemplos

```
[v0.14] Higienização pré-produção e segurança

- Webhook do MercadoPago com assinatura obrigatória e idempotente
- Rate limiting no PostgreSQL e revogação de sessões
- Dados reais na loja, ranking, perfil e home
```

```
[v0.14.1] Correção do cálculo de desconto no checkout
```
