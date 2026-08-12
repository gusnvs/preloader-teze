# Tezê · Laboratório de pré-loader

Um pré-loader que não é um pré-loader. É uma colagem de papel que se monta,
recebe a passagem de alguém que você nunca vê, e desaba — em oito cenas.

Três leituras da mesma história, todas saindo do mesmo roteiro:

| Variante              | Quando                          | Duração |
| --------------------- | ------------------------------- | ------- |
| `full`                | primeira visita                 | 6.9 s   |
| `express`             | cada navegação seguinte         | 4.5 s   |
| `prefers-reduced-motion` | por decisão do sistema       | 2.0 s   |

Repetir a versão longa a cada clique cansa; encurtar mantém o encanto. A
troca entre elas é uma linha em `motion.config.js` → `variants`.

Construído inteiramente em HTML, CSS e JavaScript. Sem vídeo, sem Lottie,
sem canvas. Motor de animação: **GSAP 3**.

---

## Como rodar

```bash
npm install
npm run dev        # http://localhost:5173
```

| Comando           | O que faz                                                    |
| ----------------- | ------------------------------------------------------------ |
| `npm run dev`     | servidor de desenvolvimento + painel de direção de arte      |
| `npm run build`   | build de produção em `dist/`                                 |
| `npm run preview` | serve o build de produção                                    |
| `npm run assets`  | reprocessa as ilustrações de `src/assets/raw` → `collage/`   |

O roteador usa History API, então o dev server e o preview já estão
configurados com fallback de SPA (`appType: 'spa'` em `vite.config.js`).
Em produção, o servidor precisa devolver `index.html` para qualquer rota.

---

## A história

O briefing pedia oito cenas. Elas existem, cada uma em seu próprio arquivo,
e a linha do tempo principal só sabe a ordem em que entram.

| # | Cena          | Arquivo                     | O que acontece                                                        |
| - | ------------- | --------------------------- | --------------------------------------------------------------------- |
| 1 | Despertar     | `scene-01-despertar.js`     | O papel aparece antes de qualquer peça. Três peças pousam, devagar.   |
| 2 | Reunião       | `scene-02-reuniao.js`       | A colagem ganha corpo, do centro para fora.                           |
| 3 | A chuva       | `scene-03-mural.js`         | **Os adesivos caem e empilham** até cobrir a tela. Física, não tween. |
| 4 | Rastro        | `scene-04-rastro.js`        | Pegadas atravessam a tela numa curva torta, alternando os pés.        |
| 5 | Reação        | `scene-05-reacao.js`        | As peças perto de cada pegada estremecem e voltam.                    |
| 6 | Brisa         | `scene-06-brisa.js`         | O ar muda. Os papéis descolam da superfície.                          |
| 7 | A queda       | `scene-07-queda.js`         | **Tudo despenca.** O papel vai primeiro; os adesivos tombam atrás.    |
| 8 | Revelação     | `scene-08-revelacao.js`     | A película se dissolve e a página assume. Sem corte perceptível.      |

Há uma nona: `scene-reduzida.js`, para `prefers-reduced-motion` — descrita
mais abaixo.

### O adesivo sendo colado

Referência: o efeito de peel do cravburgers.shop. A ideia é simples e a
execução tem uma só sutileza — **a arte é desenhada duas vezes**:

```html
<div class="tz-sticker" style="--tz-peel: 0.6">
  <div class="tz-sticker__main">…</div>   <!-- o trecho já colado -->
  <div class="tz-sticker__flap">…</div>   <!-- a aba ainda solta -->
</div>
```

A aba é a **mesma arte**, espelhada exatamente sobre a linha da dobra e
achatada para cinza — porque o que se enxerga de uma aba levantada é o verso
do papel, não a estampa. A geometria inteira sai de uma variável, lida pelo
CSS em três lugares: os dois recortes e a origem do espelhamento. Animar UM
número move a dobra e faz a aba encolher até sumir.

O adesivo cola **de baixo para cima** — a borda de baixo encosta primeiro e a
aba pende sobre a parte já colada, que é o que acontece quando se assenta um
adesivo com o polegar. E a colagem termina um pouco ANTES do movimento parar:
o polegar assenta o papel enquanto a mão ainda está acomodando a peça.

Duas diferenças em relação à original, ambas deliberadas:

**O cinza é achatado, não dessaturado.** `brightness(0)` zera o RGB
preservando o alpha — sobra a silhueta em preto — e `invert()` a levanta para
um cinza constante. É o equivalente em CSS do `feFlood` + `feComposite
in="SourceAlpha"` que a referência faz em SVG. `grayscale()` sozinho não
serviria: as peças da Tezê já são de papel claro, e dessaturar deixaria o
verso branco, invisível contra o mural.

**Sem os filtros de iluminação.** A original usa `feSpecularLighting` para o
brilho do vinil. Com mais de cem adesivos em cena, cem filtros de iluminação
custariam a animação inteira.

Nem todo mundo descola. Só peças **recortadas** (os desenhos a tinta estão
impressos NO papel, não colados SOBRE ele — não têm verso) e só acima de
14 unidades de largura: abaixo disso a aba tem poucos pixels e ninguém a
enxerga, mas custa exatamente o mesmo que num adesivo grande.

### A tela lotada

A referência (`exemplo_adesivos_teze.mp4`) pede uma coisa muito específica:
os adesivos **inundam** a tela até não sobrar nenhum pixel de fundo, e só
então a passagem acontece. Duas decisões sustentam isso.

**A maré sobe porque existe uma pilha.** Este foi o ponto que custou três
tentativas erradas, e vale registrar por quê.

Vendo só o resultado, a impressão é de uma revelação escalonada de baixo para
cima — e foi isso que tentei reproduzir primeiro, ajustando `stagger`,
direção de entrada e distância de subida. Nunca ficou parecido.

Inspecionando o screensaver da referência quadro a quadro (capturando o
`<canvas>` a cada 60 ms desde o carregamento) a causa apareceu: **os adesivos
caem do topo sob gravidade, colidem entre si e empilham a partir do chão**. A
linha que sobe é a altura da pilha, não uma frente de revelação.

Isso muda a natureza do problema. A densidade e a irregularidade não são
projetadas — elas **emergem das colisões**. Duas peças nunca se sobrepõem do
mesmo jeito e mesmo assim não sobra buraco, porque o próprio solver empurra
cada peça para o vão livre mais próximo. Nenhum valor de `stagger` produz
isso, porque não é um problema de tempo, é de espaço.

A implementação está em `physics/stickerDrop.js`, sobre `matter-js`.

**Duas naturezas de peça.** Escrever cem objetos à mão seria impossível de
manter, e cem peças aleatórias não teriam composição nenhuma. Então:

| Camada          | Origem                    | Papel                                        | Nº  |
| --------------- | ------------------------- | -------------------------------------------- | --- |
| Narrativa       | `COLLAGE` (à mão)         | conteúdo legível: a nota, o bilhete, o recibo | 31  |
| Base            | `FILL.base` (gerada)      | cobertura: fitas e retalhos grandes           | 70  |
| Acentos         | `FILL.accent` (gerada)    | detalhe: selos, carimbos, desenhos pequenos   | 42  |

A regra que segura a elegância com a tela cheia: **o preenchimento é
textura, a camada narrativa é conteúdo.** Peças com texto miúdo legível
— recibo, cartão de embarque, polaroid — ficam fora do sorteio: repetidas
cinco vezes elas leem como documento duplicado, um erro. Fitas, retalhos de
vichy e carimbos repetem à vontade, porque é assim que uma parede de
adesivos real se comporta.

Cada asset tem sua **escala natural** (`FILL.sizes`). Sem isso o gerador
trata um carimbo circular e uma fita de dois palmos como a mesma coisa, e o
carimbo vira um disco gigante no meio da tela.

### Três decisões da simulação

Sem elas o resultado é "caixas caindo", não adesivos.

**O colisor é menor que o desenho** (`colliderScale: 0.6`). Se o corpo
tivesse o tamanho da arte, as peças parariam encostadas e a parede ficaria
cheia de frestas. Encolhendo o colisor, elas se sobrepõem visualmente
enquanto a física continua estável — é daí que vem a densidade.

**A rotação é travada** (`inverseInertia = 0`). A referência deixa os
adesivos girarem livremente, e lá funciona: são grafismos que leem em
qualquer ângulo. Os da Tezê são tipografia — um recibo de cabeça para baixo
não lê como colagem, lê como defeito. Medido: com inércia alta *mas finita*,
o giro volta a acumular na segunda metade da queda, quando a pilha entra em
contato, e 75 de 130 peças acabam viradas. Só `Infinity` resolve. A variedade
de ângulos não se perde — ela já está no ângulo de projeto de cada peça — e
um assentamento de poucos graus é devolvido na entrega (`settleTilt`).

**Nada quica** (`restitution: 0`, atrito alto). Papel colado não tem energia
de volta; um adesivo que quica lê como plástico.

### Física dentro de uma timeline

Uma simulação corre em tempo real; uma timeline precisa ser posicionável e
escalável. O encaixe:

- a física **não** é ligada ao relógio da máquina. Um tween vazio de duração
  conhecida serve de régua, e a cada `onUpdate` a simulação avança até o
  tempo que o progresso do tween indica, **em passos fixos de 1/60 s**. Assim
  `timeScale` continua valendo e o resultado não muda com o FPS;
- ao terminar, a pilha é **entregue** ao GSAP: cada peça recebe a posição em
  que parou, e as cenas 4 a 8 seguem sem saber que houve física;
- durante a queda os transforms são escritos direto em `style.transform` —
  caminho mais barato para ~140 elementos por quadro. A entrega reconcilia
  isso com o cache do GSAP, senão as cenas seguintes partiriam de um estado
  que o GSAP acha que é outro;
- a geometria de projeto fica guardada em `piece.origem` e é restaurada a
  cada execução. Sem isso, a posição física de uma execução vira o ponto de
  partida da seguinte e a colagem gira um pouco mais a cada navegação.

O caminho de `prefers-reduced-motion` não usa física: as peças aparecem na
composição desenhada à mão, sem queda e sem deslocamento.

A semente é fixa (`FILL.seed`): a bagunça é sempre a mesma e, portanto,
ajustável pelo olho — a única forma de julgar uma colagem.

Verificado: no quadro em que a primeira pegada aparece, **todas as peças
estão completas**. Os adesivos chegam primeiro; a pata passa depois.

### A saída: tudo desce

A entrada é uma chuva; a saída é a mesma gravidade ao contrário. Nada parte
para os lados, nada evapora no meio do ar — **o quadro se esvazia por baixo**,
e é isso que descobre a página nova.

A cena tem **duas velocidades**, e a diferença entre elas é a revelação:

**O papel vai primeiro.** O fundo pintado despenca inteiro, e a borda de cima
dele descendo é o que abre a página. Com ele vão os **desenhos a tinta** —
eles estão impressos *no* papel, não colados *sobre* ele, e por isso entram no
mesmo tween: zero movimento relativo. Um desenho que se adiantasse meio pixel
apareceria com o retângulo branco do arquivo, porque é o papel que ele
multiplica.

**Os adesivos ficam para trás.** Cada um se solta numa onda que corre de cima
para baixo e cai mais devagar — menos massa, mais ar. O resultado é uma chuva
de recortes tombando **sobre a página já visível**, que é a única parte da
transição que o olho realmente segue.

Três consequências que valem registrar:

- **Nenhum número de velocidade ou gravidade está escrito na configuração.**
  Só tempos. A cena resolve `g = 2d/t²` com a altura real da tela, então a
  queda dura o mesmo em qualquer aparelho — em vez de ser lenta no monitor
  grande e violenta no celular.
- **Não há `ease`.** O `Physics2DPlugin` integra sobre o *tempo* do tween, e
  não sobre a curva: uma ease aqui distorceria o relógio da gravidade em vez
  do movimento. A aceleração já é a curva.
- **Não há fade.** Papel some porque saiu do quadro. Cada peça viaja uma
  distância que a põe fora da tela antes do fim do próprio tween.

O detalhe caro dessa cena está no CSS: **o papel é 30% mais alto que a tela.**
A pilha da cena 3 termina acima do quadro, e essa sobra é o que mantém
superfície embaixo dos desenhos a tinta durante a descida. Ela tem um preço —
o papel precisa percorrê-la antes de descobrir o primeiro pixel — então é a
menor que cobre a maior peça de tinta. As que ficaram inteiramente acima dela
são escondidas no início da cena: estão fora do quadro de qualquer jeito, e
deixá-las cair traria um retângulo branco atravessando a página.

A borda de ataque do papel leva três unidades de dissolução (`mask-image`).
Sem isso, uma linha reta atravessando a tela leria como cortina de teatro.

### Densidade adaptativa

A tela lotada é o ponto da animação, mas ela custa: cada peça em movimento é
um recálculo de estilo por quadro. Medindo com a CPU estrangulada em 4×, a
densidade máxima perde ~9% dos quadros; na mesma máquina sem estrangulamento,
0,1%.

Escolher um dos dois lados seria errado — baixar a densidade para todos perde
o efeito em quem aguenta, mantê-la engasga em quem não aguenta. Então o
número de adesivos é uma função do aparelho, decidida uma vez no
carregamento (`utils/deviceTier.js`), a partir de `hardwareConcurrency`,
`deviceMemory` e `connection.saveData`:

| Nível   | Peças | Com peel | CPU 4× — quadros > 20 ms | p95     |
| ------- | ----- | -------- | ------------------------ | ------- |
| `alta`  | 143   | 83       | 9,1%                     | 25,6 ms |
| `media` | 117   | 72       | 5,3%                     | 21,4 ms |
| `baixa` | 93    | 15       | **1,7%**                 | 15,6 ms |

No nível `baixa` o preenchimento não descola — só as peças narrativas, que
são poucas e grandes, e é nelas que o gesto realmente se lê.

Os sinais são grosseiros de propósito: não medem GPU nem a carga do momento,
mas separam um desktop de um celular intermediário, que é a decisão que
precisa ser tomada. Para conferir os três sem trocar de aparelho:
`?densidade=baixa`.

### Sobre a pata

Ela quase nunca aparece. A presença dela na cena são as **pegadas** — ela já
passou. O adesivo do mascote entra em apenas **22% das execuções**
(`rarity: 0.22` em `collage.config.js`), meio escondido atrás da etiqueta, e
e é sempre o **primeiro** a se soltar quando a colagem desaba (`windBias: 1.7`).
Encontrá-la é recompensa, não rotina.

> Nota sobre a identidade: as referências enviadas mostram a mascote como
> uma galinha de vichy. O briefing fala em pato. A ilustração gerada é um
> **pato** com o vestido xadrez, chapéu de palha, pérolas e scarpins pretos —
> e as pegadas são de pata palmípede. Se a leitura correta for galinha,
> troque `mascote-recortado` e `pegada` em `src/assets/raw/` e rode
> `npm run assets`: nada mais no projeto precisa mudar.

---

## Arquitetura

Três peças que não se conhecem, e um arquivo que define o contrato entre elas.

```
Router      sabe trocar o conteúdo   — não sabe animar
Preloader   sabe animar              — não sabe o que é uma rota
main.js     conhece os dois
```

O contrato inteiro é uma linha: **a página só troca quando o pré-loader avisa
que a tela está coberta.**

```js
await preloader.run({ variant: 'express', onCommit: commit });
```

`onCommit` é disparado no rótulo `coberto` da timeline — no instante em que a
colagem está completa e a atenção do olho está nas pegadas. A troca de DOM
acontece ali, invisível.

```
src/
├── main.js                      costura roteador + pré-loader
├── config/
│   ├── motion.config.js         TODO ritmo: durações, staggers, coreografia
│   └── collage.config.js        composição à mão (COLLAGE) + densidade (FILL)
├── animations/
│   ├── eases.js                 curvas da marca (CustomEase / CustomWiggle)
│   └── preloader/
│       ├── Preloader.js         orquestrador — variantes, raridade, promessa
│       ├── buildTimeline.js     só a ORDEM das cenas
│       ├── physics/stickerDrop.js   a chuva de adesivos (matter-js)
│       └── scenes/              uma cena, um arquivo
│           └── shared/entrance.js   gramática comum às cenas 1 e 2
├── components/
│   ├── PreloaderStage.js        monta o DOM uma vez e reaproveita
│   ├── CollagePiece.js          uma peça de papel
│   ├── StickerPeel.js           o adesivo sendo colado (main + aba)
│   ├── FillLayer.js             gera a densidade (base + acentos)
│   └── FootprintTrail.js        geometria da trilha (Bézier + tangente)
├── pages/                       as duas páginas de demonstração
├── styles/                      tokens · base · preloader · pages
├── utils/                       router · math · dom · viewport · assets ·
│                                deviceTier · motionPreference · devtools
└── assets/
    ├── raw/                     ilustrações originais (fonte, versionadas)
    ├── collage/                 WebP otimizado (gerado por `npm run assets`)
    └── svg/                     peças de papel desenhadas à mão
```

### As três camadas de transformação

O detalhe estrutural que sustenta tudo. Cada peça é:

```html
<figure class="tz-piece">          <!-- posição — CSS estático, GSAP nunca toca -->
  <div class="tz-piece__inner">    <!-- entrada e saída (cenas 1–3, 7)      -->
    <div class="tz-piece__media">  <!-- reação e respiro (cenas 5, 6)       -->
```

Duas timelines podem rodar sobre a mesma peça ao mesmo tempo sem disputar a
propriedade `transform`. É o que permite a peça ainda estar tremendo pela
pegada enquanto o vento já começou a levantá-la.

### Onde mexer

| Quero…                                  | Arquivo                                        |
| --------------------------------------- | ---------------------------------------------- |
| mover uma peça, girar, trocar de ato     | `config/collage.config.js` → `COLLAGE`         |
| deixar a tela mais/menos lotada          | `config/collage.config.js` → `FILL.base` (grade e `scatter`) |
| mudar o tamanho de um tipo de adesivo    | `config/collage.config.js` → `FILL.sizes`      |
| trocar a "bagunça" por outra             | `config/collage.config.js` → `FILL.seed`       |
| mudar o orçamento por aparelho           | `config/collage.config.js` → `FILL.tiers`      |
| deixar a queda mais rápida/lenta         | `config/motion.config.js` → `mural.drop.duration` e `simDuration` |
| mudar peso, atrito, altura de queda      | `config/motion.config.js` → `mural.drop`       |
| deixar a pilha mais densa                | `config/motion.config.js` → `mural.drop.colliderScale` (menor = mais denso) |
| soltar o giro dos adesivos               | `config/motion.config.js` → `mural.drop.rotationInertia` |
| mudar o gesto de colagem (cenas 1 e 2)   | `config/motion.config.js` → `awaken.peel` / `gather.peel` |
| deixar a saída mais/menos vertiginosa    | `config/motion.config.js` → `fall.duration`    |
| separar mais o papel dos adesivos        | `config/motion.config.js` → `fall.paperRatio` (menor = papel na frente) |
| mudar o ritmo, encurtar, sobrepor cenas  | `config/motion.config.js`                      |
| mudar o caráter de um movimento          | `animations/eases.js`                          |
| reordenar ou adicionar uma cena          | `motion.config.js` → `choreography` + `buildTimeline.js` |
| trocar cores e fontes                    | `styles/tokens.css`                            |
| mudar o caminho da pata                  | `collage.config.js` → `TRAIL`                  |

### Acrescentar uma cena nova

1. Crie `scenes/scene-09-nome.js` exportando uma função que recebe o contexto
   e devolve uma `gsap.timeline()`.
2. Registre em `SCENES` no `buildTimeline.js`.
3. Adicione uma linha em `motion.config.js` → `choreography`.

Nada mais. Nenhuma cena conhece as outras.

---

## Painel de direção de arte

Ajustar uma animação de seis segundos recarregando a página a cada tweak é
insustentável. Em `npm run dev` há um painel e atalhos:

| Tecla   | Ação                                              |
| ------- | ------------------------------------------------- |
| `R`     | repete a transição                                |
| `1`–`8` | salta para o início da cena                       |
| `S`     | câmera lenta (0.25×)                              |
| `G`     | abre o **GSDevTools** (barra de scrub da GreenSock)|
| `C`     | grade de composição (eixos de 10%)                |
| `H`     | esconde o painel                                  |

Parâmetros de URL: `?slow=0.2` (escala de tempo inicial) e `?scene=mural`.
`window.__teze` expõe `preloader`, `router`, `gsap`, `replay`, `seekScene`.

---

## Performance

Medido com o DevTools em `1440×900`, execução completa, nível `alta`
(**143 peças**):

| Cenário                | FPS médio | Quadros > 20 ms | p95      | CLS  |
| ---------------------- | --------- | --------------- | -------- | ---- |
| CPU normal (144 Hz)    | 144       | **0%**          | 7,2 ms   | 0.00 |
| CPU 4× throttled       | 83        | 3,2%            | 18,9 ms  | 0.00 |

A física ficou **mais barata que os tweens que ela substituiu** — antes eram
9,1% de quadros perdidos com a CPU estrangulada, agora 3,2%. Três motivos:
`matter-js` resolve todos os corpos em um laço só; os transforms vão direto
para `style.transform`, sem passar pelo GSAP a cada propriedade; e corpos que
já assentaram **dormem** e param de ser simulados.

Vale registrar como o gargalo anterior foi encontrado, porque a intuição
errou três vezes seguidas. Suspeitei do peel, dos filtros da aba e das três
camadas de `mix-blend-mode` em tela cheia. Medindo uma a uma: o peel custava
~2,4 pontos percentuais, os blends ~1, os filtros praticamente nada. O custo
era **animar 143 elementos por quadro pelo GSAP** — recálculo de estilo, que
nenhuma micro-otimização de pintura resolve. Daí a densidade adaptativa; e
daí, também, o ganho ao trocar cem tweens por uma simulação.

As decisões que sustentam isso:

- **Só `transform` e `opacity` animam.** Nenhuma sombra, filtro, `width`,
  `top` ou `left` entra em tween.
- **O layout é lido uma vez por execução**, não por tween. `measureStage()`
  congela as medidas antes de a timeline começar (`utils/viewport.js`).
- **`will-change` é temporário** — aplicado pela classe `.is-running` e
  removido ao final. Permanente, desperdiçaria memória de GPU em toda página.
- **A camada de preenchimento não projeta sombra.** Cada `drop-shadow`
  promove o elemento a uma camada de composição própria; cem delas
  custariam memória de GPU sem ganho nenhum, porque em uma parede lotada
  ninguém vê a sombra de cada adesivo — o que dá profundidade é a própria
  sobreposição. Só as 31 peças narrativas têm sombra.
- **A aba do adesivo fica fora da árvore de pintura** até o instante em que
  aquele adesivo começa a colar, e sai de novo quando termina. Cada aba
  carrega um `filter`, e manter cento e poucas vivas durante a animação
  inteira custaria mais do que a animação toda.
- **`will-change` fica em UMA das três camadas**, não em duas. Promover
  `__inner` e `__media` ao mesmo tempo, com mais de cem peças, dobra o número
  de camadas de composição e passa a custar mais do que economiza.
- **A simultaneidade é o número que importa, não o total.** Peças em
  movimento ao mesmo tempo = `duration / stagger`. A 0,72 s de entrada eram
  ~100 peças animando juntas; a 0,44 s são ~60, e a leitura não piora —
  numa inundação o gesto de cada adesivo é rápido mesmo.
- **O DOM é construído uma vez.** Recriar 143 nós e decodificar as imagens
  a cada navegação custaria justamente os primeiros quadros.
- **As imagens são decodificadas antes de animar** (`img.decode()`), fora da
  thread principal.
- **O "respiro" da cena 3 é uma transformação, não cento e nove** —
  aplicado ao mural inteiro.
- **A queda da cena 7 é resolvida pelo `Physics2DPlugin`**: uma equação só
  produz as ~109 trajetórias, e o papel inteiro (com todos os desenhos a
  tinta) sai em **um único tween** — não em trinta.

Peso do build: **48 kB de JS gzipado** (21 kB app + 27 kB GSAP), 2.6 kB de
CSS, ~466 kB de imagens WebP. As ilustrações originais somavam 12.5 MB —
`npm run assets` apara, redimensiona e converte.

---

## Acessibilidade

- **`prefers-reduced-motion: reduce`** não recebe a mesma animação mais
  devagar — recebe **outra animação** (`scene-reduzida.js`): a colagem se
  revela, permanece e se recolhe, apenas com opacidade e tempo. Zero
  deslocamento, zero rotação, zero escala. As pegadas ainda aparecem em
  sequência, porque o rastro é narrativa e não enfeite. Duração: 2.0 s.
- A colagem inteira é `aria-hidden` — é decorativa. O estado de carregamento
  chega a leitores de tela por um `role="status"` separado.
- Foco visível com a cor da marca, e a rolagem/foco voltam ao topo a cada
  navegação, como numa troca de página real.
- Contraste do texto das páginas: `#1B1B1B` sobre `#FBF7EF`.

---

## Pontos de integração

O que precisa acontecer para isto sair do laboratório.

**1. Carregamento real.** Hoje a duração é fixa. Num site de verdade o
pré-loader deve durar o tempo do carregamento, não o contrário. O ponto de
enganche já existe: `Preloader.run()` devolve uma Promise e chama `onCommit`
no meio. O padrão é segurar a timeline no rótulo `coberto` até os recursos da
próxima página resolverem:

```js
timeline.pause('coberto');
await Promise.all([carregarDados(), precarregarImagens()]);
timeline.play();
```

**2. LCP.** Uma abertura de 6.8 s empurra o LCP para ~7 s, porque a página
só se revela na cena 8. É o custo consciente de qualquer intro, e vale ser
uma decisão declarada e não uma surpresa. Mitigações: reservar a versão
completa para a primeira visita **da sessão** (`sessionStorage`) e usar
`express` no resto — o mecanismo de variantes já existe —, e oferecer um
jeito de pular.

**3. Framework.** O `Preloader` não depende do roteador. Para React Router,
Next ou Astro, basta chamar `run({ onCommit })` no hook de transição da
biblioteca; `utils/router.js` pode ser descartado inteiro.

**4. Assets finais.** As ilustrações foram geradas para este protótipo.
Substituindo os arquivos em `src/assets/raw/` pelos originais da marca e
rodando `npm run assets`, nada mais muda. Peças ausentes são simplesmente
ignoradas com aviso em dev — a composição pode ser editada antes da arte
existir.

**5. Fontes.** Hoje vêm do Google Fonts sem bloquear render. Em produção,
auto-hospedar (`@fontsource` ou WOFF2 local) elimina a dependência externa.

---

## Sugestões de evolução

- **Vento com direção variável.** `breeze.angle` é fixo em -18°. Sortear por
  execução (mantendo a semente determinística) faria cada transição terminar
  de um jeito diferente sem nenhuma peça nova.
- **Pré-carregar a próxima rota no `mouseenter` do botão.** A transição já
  dura 4 s; nesse tempo dá para trazer a próxima página inteira, e o
  pré-loader deixa de ser custo para virar orçamento.
- **Peças raras além do mascote.** O mecanismo de `rarity` é genérico. Um
  bilhete com um destino diferente, um recibo com outro valor — variações que
  só quem volta muitas vezes percebe.
- **Trilha reagindo ao cursor.** Se o mouse estiver parado sobre o mural, as
  pegadas poderiam desviar. Custa pouco e a leitura é imediata.
- **Som.** Um carimbo seco por pegada e um sopro na cena 6, com respeito a
  `prefers-reduced-motion` e sempre com opt-in.
- **Cortar para a saída.** Se a próxima página já estiver pronta na cena 2, a
  timeline poderia saltar direto para a cena 6. A estrutura de rótulos já
  permite: `timeline.tweenTo('breeze')`.

---

## Créditos técnicos

GSAP 3.15 (core, CustomEase, CustomWiggle, Physics2DPlugin, GSDevTools) ·
matter-js 0.20 (a chuva de adesivos) · Vite 7 · sharp (pipeline de assets).
Tipografia: Bodoni Moda, Courier Prime, Nothing You Could Do.

Peso do build: **77 kB gzipados de JS** (23 app + 27 GSAP + 27 física),
2,9 kB de CSS, ~466 kB de imagens WebP. A física fica em um chunk próprio
(`fisica-*.js`): só a cena 3 a usa, e isolá-la deixa visível o que ela custa.

Referências estudadas: o efeito de peel do `cravburgers.shop` e o screensaver
do `warmnfuzzy.tv`. Nenhum código foi copiado — as duas técnicas foram
inspecionadas em execução, entendidas e reimplementadas aqui, com as
adaptações que a identidade da Tezê exige (o verso cinza achatado em vez de
dessaturado, a rotação travada por causa da tipografia).
