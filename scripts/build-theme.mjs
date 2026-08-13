/**
 * ENTREGA PARA O TEMA — `npm run build:theme`
 *
 * Roda depois do `vite build --config vite.theme.config.js` e leva o
 * resultado para dentro da copia local do tema Morelia. Nada aqui publica
 * nada: o envio para a loja continua sendo manual, por FTP.
 *
 *   dist-theme/tz-preloader.js   ->  static/js/tz-preloader.js
 *   dist-theme/tz-preloader.css  ->  static/css/tz-preloader.scss
 *   src/assets/collage/*.webp    ->  static/images/tz-preloader/
 *   (gerado)                     ->  snipplets/preloader-assets.tpl
 *
 * POR QUE `.scss` PARA UM CSS
 *
 * A plataforma compila `static/css/*.scss` e serve o resultado; e o caminho
 * que o tema ja usa para todas as suas folhas. CSS puro e SCSS valido, entao
 * o arquivo atravessa sem nenhuma transformacao — e ganha o mesmo
 * cache-busting das demais.
 *
 * O ARQUIVO GERADO
 *
 * `preloader-assets.tpl` e so DADO: a lista de pecas que existem neste build.
 * A logica toda (decidir, esconder, revelar, a rede de seguranca) mora em
 * `preloader.tpl`, escrito a mao, que este script nunca toca. A separacao
 * existe para que regerar a lista jamais apague uma decisao.
 *
 * O motivo de a lista precisar existir do lado do tema: numa loja, o endereco
 * de cada arquivo e decidido pela plataforma no momento de renderizar a
 * pagina (`static_url`, com hash de versao proprio). O bundle nao tem como
 * adivinha-lo — entao o HTML entrega os enderecos prontos.
 */

import { readdir, mkdir, copyFile, readFile, writeFile, rm, stat } from 'node:fs/promises';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

import { COLLAGE, FILL } from '../src/config/collage.config.js';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(AQUI, '..');

/** O tema, por padrao, e um irmao deste projeto. `--tema=<caminho>` sobrescreve. */
const argumentoTema = process.argv.find((arg) => arg.startsWith('--tema='));
const TEMA =
  (argumentoTema && argumentoTema.slice('--tema='.length)) ||
  process.env.TEMA_DIR ||
  join(RAIZ, '..', 'projeto_tato_site_teze_nuvemshop');

const DIST = join(RAIZ, 'dist-theme');
const COLAGEM = join(RAIZ, 'src', 'assets', 'collage');

const DESTINO = {
  js: join(TEMA, 'static', 'js', 'tz-preloader.js'),
  css: join(TEMA, 'static', 'css', 'tz-preloader.scss'),
  imagens: join(TEMA, 'static', 'images', 'tz-preloader'),
  lista: join(TEMA, 'snipplets', 'preloader-assets.tpl'),
};

/**
 * As pecas dos atos 1 e 2 — as unicas que aparecem nos primeiros dois
 * segundos. Sao elas, e so elas, que ganham prioridade de carregamento no
 * HTML: pedir prioridade para as 33 seria o mesmo que nao pedir para nenhuma.
 *
 * Derivadas da composicao, e nao escritas a mao, para que uma mudanca de
 * direcao de arte nao deixe a dica de carregamento apontando para o passado.
 */
const HEROIS = COLLAGE.filter((peca) => peca.peel).map((peca) => peca.asset);

/** Assets que nao estao em `COLLAGE` mas o palco pede. */
const AVULSOS = [
  'textura-papel', // fundo do mural (`paperTextureUrl`)
  'pegada', // as duas patas da cena 4 (`FootprintTrail`)
];

const kb = (bytes) => `${(bytes / 1024).toFixed(1)} kB`;

/**
 * BLINDAGEM CONTRA O COMPILADOR DA PLATAFORMA
 *
 * A folha vai para `static/css/` com extensao `.scss` porque e assim que o
 * tema serve todas as suas — e CSS puro e SCSS valido. Quase inteiro.
 *
 * Ha uma excecao, e ela e silenciosa:
 *
 *     @media (min-aspect-ratio: 16 / 10)   ->   @media (min-aspect-ratio: 1.6)
 *
 * Dentro de uma media query o Sass avalia expressoes, e `16 / 10` e uma
 * divisao antes de ser uma proporcao. O resultado ainda compila, ainda e
 * servido, e so falha no navegador — a forma de numero unico so foi aceita
 * em Media Queries nivel 4, e navegador que nao a entende simplesmente
 * ignora a regra. Perder-se-ia a unidade de composicao ampliada das telas
 * largas, sem nenhum erro em lugar nenhum.
 *
 * Interpolar uma string devolve os tokens intactos: o Sass copia o conteudo
 * sem olhar para dentro.
 *
 * As duas proporcoes vem de `tokens.css` (escala do mural em telas largas e
 * em retrato estreito). A transformacao e feita aqui, e nao la, porque e uma
 * exigencia deste hospedeiro — o laboratorio nao tem compilador nenhum no
 * caminho e nao deve carregar a cicatriz.
 */
function blindarParaSass(css) {
  const proporcoes = /((?:min-|max-)?aspect-ratio\s*:\s*)(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/g;
  const quantas = (css.match(proporcoes) || []).length;

  const blindado = css
    .replace(proporcoes, (_, prop, a, b) => `${prop}#{"${a} / ${b}"}`)
    // O minificador cola `)and (` — legal em CSS, mas e uma fronteira a menos
    // para o analisador do Sass ter que adivinhar.
    .replace(/\)and\s*\(/g, ') and (');

  return { css: blindado, proporcoes: quantas };
}

async function existe(caminho) {
  try {
    await stat(caminho);
    return true;
  } catch {
    return false;
  }
}

async function copiar(origem, destino) {
  await mkdir(dirname(destino), { recursive: true });
  await copyFile(origem, destino);
  const { size } = await stat(destino);
  console.log(`  ${basename(destino).padEnd(26)} ${kb(size).padStart(10)}`);
  return size;
}

/** Conjunto de todos os assets que a composicao referencia. */
function assetsReferenciados() {
  const nomes = new Set([...AVULSOS, ...COLLAGE.map((peca) => peca.asset)]);
  FILL.base.pool.forEach((nome) => nomes.add(nome));
  FILL.accent.pool.forEach((nome) => nomes.add(nome));
  return nomes;
}

async function main() {
  if (!(await existe(TEMA))) {
    throw new Error(
      `Tema nao encontrado em "${TEMA}".\n` +
        'Informe o caminho com --tema=<caminho> ou a variavel TEMA_DIR.',
    );
  }
  if (!(await existe(join(DIST, 'tz-preloader.js')))) {
    throw new Error(
      'dist-theme/tz-preloader.js nao existe. Rode `npm run build:theme`, ' +
        'que faz o build antes de chamar este script.',
    );
  }

  console.log(`\nTema: ${TEMA}\n`);

  // --- 1. Bundle e folha de estilo -----------------------------------------
  console.log('Bundle');
  await copiar(join(DIST, 'tz-preloader.js'), DESTINO.js);

  const bruto = await readFile(join(DIST, 'tz-preloader.css'), 'utf8');
  const { css, proporcoes } = blindarParaSass(bruto);
  await mkdir(dirname(DESTINO.css), { recursive: true });
  await writeFile(DESTINO.css, css, 'utf8');
  console.log(
    `  tz-preloader.scss          ${kb(Buffer.byteLength(css)).padStart(10)}` +
      `  (${proporcoes} proporcoes blindadas)`,
  );

  // --- 2. Arte --------------------------------------------------------------
  const arquivos = (await readdir(COLAGEM)).filter((nome) => nome.endsWith('.webp'));
  const presentes = new Set(arquivos.map((nome) => basename(nome, '.webp')));

  await mkdir(DESTINO.imagens, { recursive: true });

  let peso = 0;
  for (const arquivo of arquivos) {
    await mkdir(DESTINO.imagens, { recursive: true });
    await copyFile(join(COLAGEM, arquivo), join(DESTINO.imagens, arquivo));
    peso += (await stat(join(DESTINO.imagens, arquivo))).size;
  }
  console.log(`\nArte\n  ${arquivos.length} arquivos WebP ${kb(peso).padStart(10)}`);

  // Limpeza de restos: esta pasta e inteiramente nossa, entao um `.webp` que
  // nao veio desta entrega e arte de uma versao anterior — e seria enviado
  // por FTP sem que ninguem o use.
  const jaLa = (await readdir(DESTINO.imagens)).filter((nome) => nome.endsWith('.webp'));
  const sobrando = jaLa.filter((nome) => !arquivos.includes(nome));
  for (const resto of sobrando) {
    await rm(join(DESTINO.imagens, resto));
    console.log(`  removido (obsoleto): ${resto}`);
  }

  // --- 3. Conferencia -------------------------------------------------------
  // Uma peca referenciada sem arquivo nao quebra nada em tempo de execucao —
  // `createCollagePiece` a ignora —, mas ela some da colagem em silencio.
  // Melhor descobrir aqui.
  const faltando = [...assetsReferenciados()].filter((nome) => !presentes.has(nome));
  if (faltando.length) {
    console.warn(`\n  ATENCAO — referenciadas na composicao e sem arquivo:`);
    faltando.forEach((nome) => console.warn(`    · ${nome}`));
  }

  // --- 4. A lista, para o template ------------------------------------------
  const nomes = [...presentes].sort();
  const herois = HEROIS.filter((nome) => presentes.has(nome));

  const linhaDoAsset = (nome) =>
    `    "${nome}": "{{ 'images/tz-preloader/${nome}.webp' | static_url }}"`;

  const lista = `{#
    ARQUIVO GERADO — nao edite a mao.

    Origem: projeto_preloader_teze, \`npm run build:theme\`.
    Qualquer alteracao aqui e perdida na proxima entrega.

    Contem apenas DADO: o endereco de cada peca deste build. A logica do
    pre-loader (quando roda, como esconde a Home, como revela) mora em
    \`snipplets/preloader.tpl\`, escrito a mao, que nenhuma entrega toca.

    POR QUE UM BLOCO DE DADOS, E NAO VARIAVEIS DE TEMPLATE

    \`{% set %}\` dentro de um \`{% include %}\` nao atravessa de volta para o
    template que incluiu — o Twig renderiza o incluido em escopo proprio.
    Entao o que atravessa e o unico veiculo que nao depende de escopo: texto
    no documento.

    POR QUE JSON INERTE, E NAO UM GLOBAL JA PRONTO

    \`type="application/json"\` nao e executado pelo navegador. Numa segunda
    visita da sessao — quando o pre-loader nao roda — isto e apenas 3 kB de
    texto que ninguem le, e nenhuma variavel nova aparece em \`window\`.
    Quem decide se vale a pena interpretar isto e \`preloader.tpl\`.

    "herois" sao as ${herois.length} figurinhas dos atos 1 e 2: as unicas em cena nos
    primeiros segundos, e por isso as unicas que pedem prioridade.
#}
<script type="application/json" id="tz-preloader-assets">
{
  "herois": [${herois.map((nome) => `"${nome}"`).join(', ')}],
  "assets": {
${nomes.map(linhaDoAsset).join(',\n')}
  }
}
</script>
`;

  await mkdir(dirname(DESTINO.lista), { recursive: true });
  await writeFile(DESTINO.lista, lista, 'utf8');
  console.log(`\nLista\n  preloader-assets.tpl       ${nomes.length} pecas, ${herois.length} prioritarias`);

  console.log('\nPronto. Os arquivos estao na copia local do tema — o envio por FTP e manual.\n');
}

main().catch((erro) => {
  console.error(`\n${erro.message}\n`);
  process.exitCode = 1;
});
