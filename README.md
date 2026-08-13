# Tezê · Laboratório de pré-loader

Um pré-loader que não é um pré-loader. É uma colagem de papel que se monta,
recebe a passagem de alguém que você nunca vê, e desaba — em oito cenas.

Três leituras da mesma história, todas saindo do mesmo roteiro:

| Variante              | Quando                          | Duração |
| --------------------- | ------------------------------- | ------- |
| `full`                | primeira visita                 | 8.3 s   |
| `express`             | cada navegação seguinte         | 5.3 s   |
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
| `npm run assets`  | reprocessa a arte de `src/assets/oficial` → `collage/`       |

O roteador usa History API, então o dev server e o preview já estão
configurados com fallback de SPA (`appType: 'spa'` em `vite.config.js`).
Em produção, o servidor precisa devolver `index.html` para qualquer rota.

---

## A história

O briefing pedia oito cenas. Elas existem, cada uma em seu próprio arquivo,
e a linha do tempo principal só sabe a ordem em que entram.

| # | Cena          | Arquivo                     | O que acontece                                                        |
| - | ------------- | --------------------------- | --------------------------------------------------------------------- |
| 1 | Despertar     | `scene-01-despertar.js`     | O papel aparece antes de tudo. **Três figurinhas são coladas**, uma a uma. |
| 2 | Reunião       | `scene-02-reuniao.js`       | Mais três, com a mão já solta. A colagem ganha corpo.                 |
| 3 | A chuva       | `scene-03-mural.js`         | **Os adesivos caem e empilham** até cobrir a tela. Física, não tween. |
| 4 | Rastro        | `scene-04-rastro.js`        | **Duas patas** atravessam a tela em curvas tortas, uma depois da outra. |
| 5 | Reação        | `scene-05-reacao.js`        | As peças perto de cada pegada estremecem e voltam.                    |
| 6 | Brisa         | `scene-06-brisa.js`         | O ar muda. Os papéis descolam da superfície.                          |
| 7 | A queda       | `scene-07-queda.js`         | **Tudo despenca.** O papel vai primeiro; os adesivos tombam atrás.    |
| 8 | Revelação     | `scene-08-revelacao.js`     | A película se dissolve e a página assume. Sem corte perceptível.      |

Há uma nona: `scene-reduzida.js`, para `prefers-reduced-motion` — descrita
mais abaixo.

### A figurinha sendo colada

O efeito de abertura, e o mais caro de acertar. **Seis figurinhas** — as
maiores da marca — são assentadas na superfície uma a uma, com dobra,
perspectiva, sombra de contato e verso siliconado.

O critério não é técnico, é de leitura. Assistindo sem explicação, a reação
tem que ser *"colaram uma figurinha ali"*. Se for *"apareceu uma imagem"*, ou
*"girou um cartão"*, está errado — e as três coisas são fáceis de confundir
num still.

**Como funciona.** A arte é recortada em N faixas. Cada faixa é um `<div>`
com uma **janela fixa** sobre a mesma imagem (`background-position`), e cada
uma recebe a rotação acumulada da sua posição na curva:

```
[colada][colada][dobra][erguida][erguida]   →  p = 0.4
[colada][colada][colada][dobra][erguida]    →  p = 0.6
```

Regiões diferentes em estados diferentes ao mesmo tempo é o efeito inteiro.
Uma `rotateX` na imagem toda seria um cartão rígido girando.

A curva não é um vinco: o ângulo cresce ao longo do que sobrou, medido em
**fração do que sobrou** — por isso o enrolamento encolhe junto com a parte
solta em vez de manter o mesmo raio até o fim. A matemática está separada do
DOM em `animations/peel/peelGeometry.js`, justamente para poder ser discutida
sem abrir uma linha de CSS.

**Três decisões que decidiram o resultado.**

*O ângulo máximo separa colar de descolar.* Passando bem de 90° a ponta tomba
para trás e cobre o que já está colado: é o gesto de **arrancar** um adesivo,
e visto de frente vira uma tábua cinza deitada sobre a arte. Perto de 80° a
figurinha fica **erguida**, apoiada na linha de contato, com a estampa virada
para quem olha — a mão segurando o adesivo antes de assentar. O verso só
aparece no fim, numa lasquinha.

*O ponto de fuga não fica no centro.* Com a câmera exatamente de frente, uma
figurinha enrolando na direção do observador só ENCURTA: o volume some dentro
do próprio encurtamento. Deslocando `perspective-origin` para além da borda
solta, a parte levantada se projeta ao contrário e a ponta sobe por cima do
que já está colado. A parte colada (z = 0) não se move um pixel com isso.

*A luz precisa saber qual lado da folha está olhando.* O mesmo cosseno para
as duas faces achata o rolo — passado o meio-giro toda faixa bate no piso do
sombreado e a ponta vira um cinza só. A face de trás tem a normal invertida,
e é ela que, virada para cima no fim do giro, fica mais clara de todas.

**Por que CSS 3D, e não SVG, Canvas ou WebGL.**

| Técnica | Por que não |
| ------- | ----------- |
| SVG (mask/clipPath) | máscara controla *quanto* da arte aparece, não curva superfície nem gera perspectiva |
| Canvas 2D | repinta a figurinha inteira por quadro, em 2× de DPR, na CPU — e ainda vêm 130 adesivos caindo depois |
| WebGL | resolveria com malha e shader, e traria Three.js, um contexto de GPU e um segundo pipeline de render para 1,5 s de efeito |

O CSS 3D entrega o que interessa: a perspectiva é do navegador (a faixa longe
encurta de verdade), a composição é da GPU, e durante a animação só mudam
`transform`, `filter` e `opacity` — nenhuma pintura, nenhum layout.

**A API.** Um número, de 0 a 1:

```js
const peel = createPeelSticker({ src, ratio, direction: 'left', slices: 16 });
gsap.to(peel, { progress: 1, duration: 0.96, ease: 'tz.press' });
```

`progress` é uma propriedade comum — o GSAP escreve nela como escreveria em
qualquer objeto. Sem `onUpdate`, sem proxy. E escrever um valor menor que 1
**desfaz o assentamento sozinho**: `seek()` suprime callbacks, então um
`reset()` chamado por `tl.call()` simplesmente não acontece quando a timeline
é arrastada — a figurinha ficaria colada no meio da própria colagem.

**Direções.** As quatro bordas (`top`, `bottom`, `left`, `right`) são a mesma
conta vista de outro ângulo; a conversão é uma rotação no plano feita pelo
próprio CSS. As diagonais são apelidos da borda dominante: faixa diagonal não
existe (a janela de uma faixa é um recorte retangular da arte), e torcer o
eixo de rotação abre fendas em V entre as faixas — medido, ~11 px com 12
faixas. A inclinação vem de graça de outro lugar: **a peça já é girada na
composição**, e uma figurinha com `rot: -6` colando de cima para baixo já
chega com a dobra inclinada.

**Terminada a colagem**, `settle()` troca as N faixas por uma única imagem. O
resto da timeline — a chuva, as pegadas, a queda — não deve pagar por um
efeito que já acabou.

> **`?lab=peel`** abre o laboratório: uma figurinha, grande, com o progresso
> na mão. `&strip=1` mostra seis progressos lado a lado — julgar a progressão
> vendo a animação rodar é impossível, o olho não guarda o quadro anterior.
> `&art=` e `&dir=` trocam arte e borda.

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

| Camada          | Origem                    | Papel                                          | Nº  |
| --------------- | ------------------------- | ---------------------------------------------- | --- |
| Figurinhas      | `COLLAGE`, atos 1–2       | as seis que são **coladas** — a marca           | 6   |
| Narrativa       | `COLLAGE`, ato 3          | conteúdo legível: a nota, o bilhete, o recibo   | 22  |
| Base            | `FILL.base` (gerada)      | cobertura: papel escrito, quadros, padronagem   | 80  |
| Acentos         | `FILL.accent` (gerada)    | detalhe: selos, carimbos, desenhos pequenos     | 54  |

A regra que segura a elegância com a tela cheia: **o preenchimento é
textura, a camada narrativa é conteúdo.** Peças com texto miúdo legível
— recibo, cartão de embarque, polaroid — ficam fora do sorteio: repetidas
cinco vezes elas leem como documento duplicado, um erro. Retalhos de xadrez,
listras e carimbos repetem à vontade, porque é assim que uma parede de
adesivos real se comporta.

**A padronagem é fundo, não conteúdo.** Na primeira versão o sorteio da base
era só xadrez e listra, e a parede virou papel de parede: a arte da marca
sumia dentro da própria repetição. Hoje elas ocupam menos de um terço do
sorteio, e o resto é desenho — bilhete, recibo, nota, quadro. A troca custou
cobertura (peça recortada cobre menos que um retângulo de padrão), e foi paga
com uma coluna a mais na grade e peças ~12% maiores.

Cada peça aparece **~3 vezes** na parede (80 peças / 20 casas). É o limite:
acima disso um bilhete com texto legível lê como documento duplicado; abaixo,
sobra buraco.

E o sorteio tem **memória curta**: as últimas 4 escolhas ficam de fora da
próxima. Sorteio uniforme puro produz vizinhos iguais o tempo todo, e dois
bilhetes idênticos encostados não leem como acaso — leem como bug. No total
cada peça continua saindo o mesmo tanto; ela só não sai duas vezes seguidas.

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
estão completas**. Os adesivos chegam primeiro; as patas passam depois.

### As duas patas

São dois caminhos, não um (`TRAIL.paths`), e a segunda pata começa **quase um
segundo depois** da primeira. O intervalo é o que separa "duas patas" de "uma
pata com o dobro de pegadas": tempo de ler o primeiro caminho como um caminho
antes de o segundo existir.

As duas vão em **sentidos opostos**: a da esquerda desce para o rodapé, a da
direita sobe e sai pelo topo. Duas patas indo para o mesmo lado leem como uma
só, cortada ao meio; em sentidos contrários, leem como duas.

Inverter o sentido é trocar `from` por `to` — a curva é a mesma, percorrida ao
contrário — e a orientação se resolve sozinha: os dedos seguem a tangente do
caminho, e a tangente inverteu junto.

Cada pegada carrega o `delay` da sua trilha, então a cena que as anima não
precisa saber que existe mais de um caminho — ela lê o instante de cada passo
e obedece. Acrescentar uma terceira pata é escrever um objeto em `paths`.

A cadência (`footsteps.stagger`) é o tempo entre uma pata e outra tocarem o
chão, e é o número que decide tudo: abaixo de ~0,12 s vira corrida, e o que
se lê é um rastro sendo desenhado, não alguém caminhando.

A pegada oficial é um **adesivo recortado amarelo**, e isso mudou a cena: a
versão anterior era tinta em fundo branco aplicada em `multiply`, e sumia
contra a parede de listras. Um amarelo opaco não some — e multiplicá-lo
contra listras vermelhas e xadrez azul só o transformaria em barro. A camada
do rastro perdeu o `mix-blend-mode` junto.

A última pegada de cada trilha espera um pouco mais para secar: é ela que
fecha o caminho, e sumir no mesmo ritmo das outras cortaria a frase no meio.

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

A borda de ataque do papel leva três unidades de dissolução (`mask-image`).
Sem isso, uma linha reta atravessando a tela leria como cortina de teatro — e
é só para essa dissolução caber fora do quadro que o papel é 10% mais alto
que a tela.

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

| Nível   | Peças | Faixas por figurinha | CPU 4× — quadros > 20 ms   |
| ------- | ----- | -------------------- | -------------------------- |
| `alta`  | 162   | 16                   | 13% (colagem) · 31% (queda) |
| `media` | 106   | 12                   | —                          |
| `baixa` | 84    | 8                    | —                          |

Sem estrangulamento, em 144 Hz: **6,9 ms de mediana e zero quadros perdidos**
na colagem e na chuva; três quadros acima de 20 ms na queda inteira. O nível
`alta` é generoso de propósito — quem não aguenta cai para `media` antes de
qualquer quadro ser perdido.

O nível decide duas coisas: quantos adesivos caem na chuva e em quantas
faixas cada figurinha é recortada para colar. Menos faixas = curva mais
facetada, mesmo gesto.

Os sinais são grosseiros de propósito: não medem GPU nem a carga do momento,
mas separam um desktop de um celular intermediário, que é a decisão que
precisa ser tomada. Para conferir os três sem trocar de aparelho:
`?densidade=baixa`.

### Sobre a pata

Ela quase nunca aparece por inteiro. A presença dela na cena são as
**pegadas** — ela já passou. O adesivo da Madame de boina entra em apenas
**34% das execuções** (`rarity` em `collage.config.js`) e é sempre o
**primeiro** a se soltar quando a colagem desaba (`windBias: 1.7`).
Encontrá-la é recompensa, não rotina.

> A arte é a oficial da marca (`src/assets/oficial/`), com uma exceção: a
> **pegada**. A cartela não traz uma, e o rastro é narrativa da animação, não
> da marca — então ela continua sendo a desenhada para o laboratório. É
> também a única peça em fundo branco, aplicada em `multiply`. Substituindo
> `pegada.png` e rodando `npm run assets`, nada mais precisa mudar.

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
│   ├── PeelSticker.js           a figurinha que cola (faixas + verso + sombra)
│   ├── FillLayer.js             gera a densidade (base + acentos)
│   └── FootprintTrail.js        geometria da trilha (Bézier + tangente)
├── pages/                       as duas páginas de demonstração
├── styles/                      tokens · base · preloader · pages
├── utils/                       router · math · dom · viewport · assets ·
│                                deviceTier · motionPreference · devtools
└── assets/
    ├── oficial/                 a arte da marca (fonte, versionada)
    ├── collage/                 WebP + `manifesto.json` (`npm run assets`)
    └── _legado/                 a arte do protótipo, fora do bundle
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
errou três vezes seguidas. Suspeitei do peel, dos filtros e das camadas de
`mix-blend-mode` em tela cheia. Medindo uma a uma: nenhuma delas era o custo.
Era **animar 143 elementos por quadro pelo GSAP** — recálculo de estilo, que
nenhuma micro-otimização de pintura resolve. Daí a densidade adaptativa; e
daí, também, o ganho ao trocar cem tweens por uma simulação.

A colagem das seis figurinhas, medida com a CPU 4× estrangulada, custa 6% de
quadros acima de 20 ms — abaixo da chuva e da queda. São ~160 elementos, mas
só dois ou três estão sendo assentados ao mesmo tempo, e o que muda neles é
`transform` e `filter`: trabalho de compositor, não de pintura.

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
  sobreposição. Só as peças narrativas têm sombra.
- **As faixas da figurinha ficam fora da árvore de pintura** até o instante
  em que ela começa a colar, e saem de novo quando termina (`settle()`).
  Cada faixa em movimento carrega um `filter` de iluminação: mantê-las vivas
  durante a animação inteira custaria mais do que a animação toda.
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
  produz as ~130 trajetórias.
- **A colagem sai de cena quando termina.** `settle()` troca as N faixas de
  cada figurinha por uma única imagem: as seis somam ~160 elementos enquanto
  estão sendo assentadas, e zero depois disso.

Peso do build: **73 kB de JS gzipado** (19 app + 27 GSAP + 27 física), 3,1 kB
de CSS, ~1,4 MB de imagens WebP. A arte oficial somava 120 MB em PNG —
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

Peso do build: **73 kB gzipados de JS** (19 app + 27 GSAP + 27 física),
3,1 kB de CSS, ~1,4 MB de imagens WebP. A física fica em um chunk próprio
(`fisica-*.js`): só a cena 3 a usa, e isolá-la deixa visível o que ela custa.

Arte: a cartela oficial da Tezê (`src/assets/oficial/`), incluindo a paleta,
lida dela e não aproximada. A única peça de fora é a pegada — a cartela não
traz uma.

Referências estudadas: o efeito de peel do `cravburgers.shop` e o screensaver
do `warmnfuzzy.tv`. Nenhum código foi copiado — as duas técnicas foram
inspecionadas em execução, entendidas e reimplementadas aqui, com as
adaptações que a identidade da Tezê exige. A colagem, em particular, não usa
a técnica da referência (a arte espelhada e achatada para cinza): ela é uma
cadeia de faixas em perspectiva real, porque a aba espelhada não curva, não
encurta e não recebe luz.
