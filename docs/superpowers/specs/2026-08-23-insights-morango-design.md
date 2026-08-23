# Módulo de insights de preço do morango — Design

**Data:** 2026-08-23
**Status:** aprovado, pronto para plano de implementação

## Contexto

Hoje o CPAM Conecta só tem `/admin/lancar-preco`, onde o preço diário do morango
(4 categorias: Velho, Bom, Safra Nova Top, Safra Nova Diferenciado) é lançado manualmente
na tabela `precos_morango`. Esses dados ficam acumulados mas não têm nenhuma visualização —
esta etapa adiciona uma página de insights que transforma o histórico já lançado em
gráficos, para acompanhar tendência de preço e comparar categorias/anos.

## Escopo desta etapa

**Dentro do escopo:**
- Nova rota protegida `/admin/insights`, mesmo padrão de autenticação/shell já existente
  (`middleware.ts`, `admin/layout.tsx`).
- Filtro de período (30 dias / 90 dias / ano atual / tudo) que controla o gráfico de
  evolução e os cards de resumo. Estado do filtro na querystring (`?range=`).
- Gráfico de linha: evolução do preço no tempo, uma linha por categoria, no período
  selecionado.
- Cards de resumo do período selecionado: preço médio, maior alta, menor preço, data do
  último lançamento (métricas exatas a refinar na implementação, ver "Assunções").
- Gráfico de barras: preço médio anual por categoria (independente do filtro de período —
  sempre mostra todos os anos com dados).
- Item de navegação novo em `admin/layout.tsx` (`NAV_ITEMS`) apontando para
  `/admin/insights`.
- Novo dependency: `recharts`.
- Estado vazio: quando o período selecionado não tem nenhum lançamento.

**Fora do escopo (explicitamente adiado):**
- Exportar dados (CSV/imagem do gráfico).
- Comparação de categoria única / drill-down por categoria.
- Qualquer nova coluna ou migration no schema de `precos_morango` — este módulo é somente
  leitura sobre os dados já existentes.
- Cache/otimização de performance além do que o Next.js já faz por padrão — volume de
  dados é baixo (lançamento manual diário).

## Convenções do projeto (já fixadas, não abertas a esta spec)

- Todo código de implementação passa pelo workflow `superpowers` (esta spec → plano via
  `writing-plans` → execução com TDD). Nunca escrever código direto de uma spec.
- Toda decisão de UI/UX (layout, hierarquia visual, estados, texto exato) é feita pela
  skill `impeccable` durante a implementação; decisões específicas de gráfico (cor por
  série, forma, eixo, tooltip, legenda) passam pela skill `dataviz`. Esta spec define **o
  que** precisa existir funcionalmente, nunca **como** aparece na tela.
- Git: branches `main` (produção) e `dev` (desenvolvimento). Trabalho solo, sem PR — commit
  e push direto em `dev`. `main` só é atualizada quando pedido explicitamente.
- Interface em pt-BR, código (nomes de arquivo, variáveis, funções, comentários) em en-US.
  Schema do banco permanece pt-BR (`precos_morango`, `categoria`, etc. — convenção já
  registrada na spec anterior).
- Gerenciador de pacotes: npm.

## Arquitetura

Mesmo padrão de `lancar-preco`: Server Component busca dados no servidor lendo
`precos_morango` via `createSupabaseServerClient`, agregações são calculadas em TypeScript
(sem view/RPC nova no Postgres — volume de dados não justifica), e os gráficos em si são
Client Components (Recharts precisa de interatividade no cliente: tooltip, resize).

Estrutura de arquivos prevista (nomes indicativos, podem ajustar levemente na
implementação):

```
src/
  app/
    admin/
      layout.tsx                      # + item de nav "Insights"
      insights/
        page.tsx                      # server component: lê ?range=, busca dados, monta layout
        data.ts                       # getPriceHistory(range), getAnnualAverages()
        period-filter.tsx             # client component: pills 30d/90d/ano/tudo
        summary-stats.tsx             # cards de resumo do período
        price-trend-chart.tsx         # client component: LineChart Recharts
        annual-averages-chart.tsx     # client component: BarChart Recharts
```

## Fluxo de dados

1. **Carregar `/admin/insights`** (sem `?range=`): server component assume período padrão
   "90 dias".
2. **`getPriceHistory(range)`**: busca em `precos_morango` as linhas (`data`, `categoria`,
   `preco_min`, `preco_max`) com `data` dentro do intervalo do `range` selecionado,
   ordenadas por `data` ascendente. Serve de base para o gráfico de linha e para o cálculo
   dos cards de resumo (feito em TS a partir dessas linhas).
3. **`getAnnualAverages()`**: busca todas as linhas históricas (sem filtro de `range` —
   este gráfico é sempre "tudo"), agrupa por `extract(year from data)` × `categoria` em
   TypeScript, calcula a média de `(preco_min + preco_max) / 2` por grupo.
4. **Trocar o filtro de período**: `period-filter.tsx` navega para
   `/admin/insights?range=30d` (ou `90d`/`ano`/`tudo`), recarregando a página com o novo
   período — mesmo padrão de navegação por querystring já usado em `lancar-preco`.
5. **Sem dados no período**: `price-trend-chart.tsx` e `summary-stats.tsx` mostram um
   estado vazio (redação exata via `impeccable`) em vez de gráfico/números zerados.

## Cálculos (requisitos funcionais)

- **Preço "representativo" de uma linha**, usado em médias e no eixo Y do gráfico de
  evolução: `(preco_min + preco_max) / 2`. Aplica-se tanto aos cards de resumo quanto às
  médias anuais.
- **Cards de resumo do período**: preço médio (média do preço representativo de todas as
  linhas do período), maior alta (maior `preco_max` do período, com sua data/categoria),
  menor preço (menor `preco_min` do período, com sua data/categoria), último lançamento
  (linha mais recente do período, todas as categorias daquela data).
- **Médias anuais**: uma barra por categoria por ano; anos sem nenhum lançamento não
  aparecem no eixo X.
- **Mapeamento de `range` para intervalo de datas**: `30d`/`90d` = últimos N dias corridos
  a partir de hoje; `ano` = ano corrente (1º de janeiro até hoje); `tudo` = sem limite
  inferior de data.

## Testes

- **Vitest** para lógica pura: `getAnnualAverages` (agrupamento por ano/categoria, anos
  sem dados omitidos), cálculo dos cards de resumo (maior alta, menor preço, média,
  último lançamento) e o mapeamento `range` → intervalo de datas — todos testáveis com
  arrays de linhas fixture, sem precisar de banco real.
- Componentes de gráfico (Recharts) validados visualmente rodando o dev server, sem teste
  automatizado dedicado — mesmo critério já usado no formulário de `lancar-preco`.

## Assunções registradas

- "Preço representativo" = média de min/max. Não há um único "preço" lançado por
  categoria/dia — cada lançamento é um intervalo (min, max) — então cards e médias
  anuais precisam de uma forma de reduzir isso a um número; média do intervalo é a leitura
  mais direta e será validada visualmente com o usuário na implementação.
- O gráfico de evolução no tempo plota apenas o preço representativo por linha (não a
  amplitude min/max como uma banda/área) — mostrar min/max como banda foi considerado no
  brainstorming mas não foi pedido explicitamente; pode virar um refinamento futuro.
- Período padrão ao abrir a página sem `?range=`: 90 dias.
