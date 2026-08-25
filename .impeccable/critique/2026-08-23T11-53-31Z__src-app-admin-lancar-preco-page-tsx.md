---
target: desktop /admin/lancar-preco dashboard
total_score: 22
max_score: 36
na_heuristics: 10
p0_count: 2
p1_count: 1
timestamp: 2026-08-23T11-53-31Z
slug: src-app-admin-lancar-preco-page-tsx
---
Method: dual-agent (A: design-review sub-agent · B: detector + browser-evidence sub-agent)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3/4 | Spinner, status por dia/categoria, confirmação com timestamp — sólido |
| 2 | Match System / Real World | 3/4 | `<input type="date">` nativo renderiza MM/DD/YYYY (US) ao lado de uma lista que lê DD/MM (pt-BR) |
| 3 | User Control and Freedom | 2/4 | Sem cancelar/desfazer no meio da edição; navegar para um dia fora da lista visível exige o date-picker nativo |
| 4 | Consistency and Standards | 2/4 | Consistência interna forte, mas quebra convenção web/dashboard: campos sem caixa não leem como editáveis para não-power-users; calendário nativo do date input é chrome não estilizado |
| 5 | Error Prevention | 2/4 | `savePrices` faz upsert incondicional em `(data, categoria)` — reabrir um dia já "Lançado", editar e salvar sobrescreve sem nenhuma confirmação |
| 6 | Recognition Rather Than Recall | 3/4 | Status sempre visível por dia/categoria |
| 7 | Flexibility and Efficiency of Use | 1/4 | Tarefa diária repetitiva sem nenhum acelerador (copiar preço de ontem, atalho de teclado, colagem em lote) |
| 8 | Aesthetic and Minimalist Design | 3/4 | Restrição visual forte no componente, mas vira espaço morto em telas largas |
| 9 | Help Recognize/Diagnose/Recover from Errors | 3/4 | Erros inline por categoria via `role="alert"`, bem localizados |
| 10 | Help and Documentation | n/a | Genuinamente inaplicável — 1-2 usuários treinados diretamente pelo dono |
| **Total** | | **22/36 (61%)** | **Acceptable — melhorias significativas necessárias** |

## Design Specificity Verdict

A camada de tokens e componentes ("The Entreposto Board") é genuinamente específica do produto — chão quase preto verde-ardósia, tipografia chalk-white, um único acento vermelho-morango reservado à ação primária/foco, campos em linha ao invés de caixa, vocabulário de categoria correto (Velho, Bom, Safra Nova Top, Safra Nova Diferenciado). Isso não é reskin de template.

Mas na camada de layout/IA — exatamente a camada que motivou este critique — não há nenhum pensamento específico de desktop. `src/app/admin/lancar-preco/page.tsx:24` fixa `max-w-md` (28rem/448px) para todo viewport, de 320px a 4K. Confirmado visualmente em 1440×900 e 1920×1080: a coluna não cresce, só recentraliza em mais vazio. Qualquer dashboard genérico produziria a mesma silhueta nessas larguras. A queixa do usuário está correta, e está correta precisamente porque o breakpoint desktop é o único lugar do código onde "específico deste produto" silenciosamente vira "o que o `max-w-md` dá de graça".

**Scan determinístico**: `detect.mjs` rodado sobre os 5 arquivos-fonte (`page.tsx`, `recent-days-list.tsx`, `strawberry-price-form.tsx`, `layout.tsx`, `nav-link.tsx`) voltou limpo (exit 0, `[]`) — análise estática do código-fonte não pega nada. Já a injeção do detector no DOM renderizado (browser real, autenticado, 1440×900/1920×1080) encontrou 2 tipos de anti-padrão em todo estado testado:
- `overused-font`: Geist é 100% do texto da página — **falso positivo**: DESIGN.md documenta isso como escolha deliberada ("The One Face Rule"), não descuido.
- `flat-type-hierarchy`: escala de 12–20px (razão 1.7:1) — **não é falso positivo**: corrobora diretamente a falha de hierarquia visual que a Assessment A já tinha achado por outro caminho (lista de histórico com o mesmo peso visual do formulário da tarefa).

**Evidência visual**: a injeção do overlay funcionou de fato — o banner `[impeccable] 1 anti-pattern found` renderizou na página real (capturado no screenshot `03-form-1440x900.png`), não é uma alegação sem prova. Como este ambiente não tem uma aba de navegador ao vivo para apresentar ao usuário, a evidência é a captura de tela, não uma aba "[Human]" interativa.

## Overall Impression

O sistema de design em si tem uma tese clara e bem executada — "quadro de preços do entreposto", um acento só, sem cartões, sem sombra. O problema não é o vocabulário visual, é que ele nunca recebeu uma passada de desktop: a página inteira (lista de 11-15 dias + formulário de 4 categorias) fica presa numa coluna de 448px cravada no centro de qualquer tela, deixando ~70% da largura em 1440px como chão vazio sem função. A maior oportunidade não é "redesenhar" — é dar ao shell `/admin` uma composição real de desktop (navegação lateral + duas colunas) que usa a largura para densidade de informação em vez de margem, e resolver de caminho a sobrescrita silenciosa de preço já lançado, que é o risco mais sério de todo o fluxo.

## What's Working

- **"Novo" vs "Atualizado" no estado de sucesso** (`strawberry-price-form.tsx:288`): depois de salvar, o sistema diz explicitamente o que mudou por categoria — feedback honesto e específico, constrói confiança.
- **Entrada de preço nativa pt-BR**: `parsePrice`/`toFieldValue` aceitam e exibem `8,50` (vírgula decimal), compatível com o teclado numérico de um celular brasileiro — empatia de domínio real, não só i18n de prateleira.
- **Regra do acento único**: vermelho-morango aparece exatamente uma vez como cor de UI (botão salvar/foco) em toda a tela. Num campo de quase-preto e branco-giz, essa disciplina dá à ação de salvar prioridade inconfundível.

## Priority Issues

**[P0] Layout desktop é o mobile esticado, não um layout** — `src/app/admin/lancar-preco/page.tsx:24` (`max-w-md` fixo em todo breakpoint).
- **Por que importa**: é exatamente a queixa que motivou este critique, confirmada visualmente em 1440×900 e 1920×1080 — a coluna nem cresce, só recentraliza em mais espaço vazio. Nenhuma convenção de dashboard (navegação lateral persistente, densidade de dados, colunas lado a lado) está sendo usada.
- **Fix**: dar ao shell `/admin` uma composição real em `≥lg` — rail de navegação à esquerda (hoje trivial com uma rota, mas o shell deve já nascer pronto pra crescer) + corpo em duas colunas: lista de dias recentes como painel lateral persistente, formulário de preço como painel principal de trabalho.
- **Comando sugerido**: `/impeccable layout`

**[P0] Sobrescrita silenciosa de preço já lançado** — `src/app/admin/lancar-preco/actions.ts:95-97`.
- **Por que importa**: `savePrices` faz `upsert` incondicional em `(data, categoria)`, sem confirmação e sem o botão mudar de rótulo, mesmo este sendo descrito como o registro de verdade da decisão de preço. Reabrir um dia "Lançado", editar e salvar sobrescreve sem aviso.
- **Fix**: quando `launchedCategories` não for vazio para o dia selecionado, trocar o texto do botão ("Atualizar preços" vs "Salvar preços") e/ou exigir uma confirmação leve antes de commitar.
- **Comando sugerido**: `/impeccable harden`

**[P1] Lista de histórico na frente da tarefa** — `recent-days-list.tsx:36-88`.
- **Por que importa**: 11-15 linhas de status "Lançado" renderizam antes do formulário em toda carga de página, invertendo a prioridade (falha em 4 dos 8 itens do checklist de carga cognitiva: chunking, hierarquia visual, escolhas mínimas, disclosure progressivo). O detector corrobora via `flat-type-hierarchy` — histórico e formulário competem com o mesmo peso visual.
- **Fix**: colapsar a lista numa faixa compacta (ex.: últimos 7 dias + "ver mais") ou movê-la para a lateral, para o formulário ser a primeira dobra em qualquer viewport.
- **Comando sugerido**: `/impeccable distill`

**[P2] Input de data nativo quebra consistência de locale e o sistema visual** — `strawberry-price-form.tsx:135-143`.
- **Por que importa**: `<input type="date">` nativo renderiza MM/DD/YYYY (US) ao lado de uma tela onde toda outra data lê DD/MM (pt-BR); é também o único elemento interativo que o design system não controla — o popup de calendário nativo não tem nada do tema do quadro.
- **Fix**: forçar o formato exibido de forma consistente com o resto da tela (mask/controlado), ou aceitar o widget nativo mas embrulhá-lo para o popup não parecer um objeto estranho pousando no quadro.
- **Comando sugerido**: `/impeccable adapt`

**[P3] Botão "Ver" morto ao lado de um campo que já auto-navega** — `strawberry-price-form.tsx:141,144-151`.
- **Por que importa**: o `onChange` do campo de data já chama `requestSubmit()`; o botão "Ver →" ao lado duplica essa ação para quem usa mouse, sem fazer nada, e ainda adiciona ruído visual num ponto de decisão que devia ser trivial.
- **Fix**: remover o botão para uso por ponteiro, mantendo-o (ou equivalente) só como fallback sem-JS/teclado, com peso visual reduzido.
- **Comando sugerido**: `/impeccable quieter`

## Persona Red Flags

**Alex (Power User)**:
- Toda vez que abre a página, precisa rolar 11+ linhas de status de dias passados antes de chegar no formulário de hoje — para uma tarefa que devia ser quase instantânea.
- Quer copiar os preços de ontem como ponto de partida (comum em precificação diária de hortifrúti) — não existe essa opção; precisa redigitar 4 categorias × 2 campos do zero.
- Em desktop, tem 1000+ pixels ociosos de largura e não consegue ver a lista de dias e o formulário lado a lado para conferir enquanto digita — tudo é coluna única, forçando rolar-e-lembrar em vez de olhar-e-comparar.
- O botão "Ver" (`strawberry-price-form.tsx:144-151`) é um alvo de clique desperdiçado que Alex vai instintivamente tentar usar, sem perceber que o `onChange` da data já navegou.

**Sam (Usuário dependente de acessibilidade)**:
- Campos sublinhados sem caixa (`border-0 border-b-2 border-board-rule`) não têm nenhuma affordance visível distinguindo "campo vazio" de "rótulo estático" para quem tem baixa visão escaneando rápido.
- `chalk-placeholder` usado em "Sem lançamento" e em placeholders contra `board-ground` é um par de baixo contraste — já sinalizado em memória do projeto como WCAG pendente, e visivelmente reproduzido nestes screenshots ("SEM LANÇAMENTO" vs "LANÇADO").
- O `<input type="date">` nativo (do qual Sam depende para comportamento de teclado/leitor de tela) mostra formato MM/DD enquanto o resto da tela lê DD/MM — um leitor de tela lê duas convenções de data contraditórias na mesma tela.
- Não há região `aria-live` ligando a seleção de um dia na lista à atualização do formulário abaixo — para um usuário de leitor de tela, selecionar um dia e o formulário se repopular mais abaixo acontece sem nenhum anúncio de conexão entre os dois.

## Minor Observations

- Nota de amarração: o detector reporta "**1** anti-pattern found" no cabeçalho enquanto lista 2 tipos distintos de achado embaixo, em toda captura — discrepância no próprio detector, reportada como observada, não interpretada.
- Escala de tipo detectada muda entre 4 tamanhos (1440×900, lista padrão) e 6 tamanhos (1920×1080 e outro-dia-selecionado) — dado bruto do detector, incluído para o registro.
- `STRAWBERRY_CATEGORIES` (Velho, Bom, Safra Nova Top, Safra Nova Diferenciado) lê como ordem crescente de qualidade, mas não está rotulada como ordem — um usuário novo precisa inferir isso só pela semântica em português.
- O header com um único item de nav ("LANÇAR PREÇO") ocupa uma barra full-width vazia — inofensivo hoje (rota única), mas vale revisitar quando existir uma segunda rota, já que o padrão atual (`NavLink`) é uma tab strip plana, não um rail de desktop.

## Questions to Consider

- Se isto é mesmo mobile-first e o dono "num celular" é o dispositivo primário, por que o breakpoint desktop existe na forma atual — ele deveria ativamente *desencorajar* o uso em tela larga (ex.: um tratamento tipo "moldura de celular" centralizada que leia como intencional) em vez de esticar silenciosamente num vazio sem estilo que parece bug?
- O estado de sucesso já sabe, antes de salvar, se é uma entrada nova ou uma sobrescrita (por isso consegue mostrar "Novo" vs "Atualizado" depois). Por que esse mesmo conhecimento não é usado *antes* da ação destrutiva acontecer?
- A lista histórica de 11-15 dias realmente merece o lugar permanente acima da dobra, ou é resquício de "vamos mostrar os dados que temos" em vez de resposta pensada para "o que o usuário precisa primeiro ao abrir o app"?
