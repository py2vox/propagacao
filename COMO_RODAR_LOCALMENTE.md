# Como rodar o AGHIP localmente

Não há instalação, build ou dependências — é um único arquivo `index.html` com HTML, CSS e JavaScript. Existem duas formas de rodar, dependendo do que você precisa.

## Opção 1 — Abrir direto (mais simples)

1. Baixe o arquivo `index.html`.
2. Dê duplo clique nele, ou arraste para uma aba do navegador.

Isso funciona para a grande maioria das funcionalidades: HF, VHF, EME, meteorologia, INMET, radar, gráficos. Foi o método usado durante praticamente todo o desenvolvimento e teste deste projeto.

**Ponto de atenção conhecido:** o card de raios via satélite (GOES-19/GLM) carrega uma biblioteca científica (`h5wasm`) usando a sintaxe moderna de módulos JavaScript (`<script type="module">`). Alguns navegadores — principalmente versões mais antigas do Chrome — são mais restritivos com esse tipo de carregamento quando a própria página é aberta como arquivo local (`file://`) em vez de servida por HTTP. Se todo o resto do painel funcionar, mas especificamente o card de raios não carregar, use a Opção 2 abaixo.

## Opção 2 — Servidor local (mais robusto, resolve o ponto acima)

Sobe um servidor mínimo na sua própria máquina, sem precisar de internet além do necessário pras APIs. Escolha um dos comandos abaixo, o que já estiver disponível no seu sistema.

**Com Python** (já vem instalado no macOS/Linux; no Windows, baixe em [python.org](https://python.org)):

```bash
cd pasta-onde-esta-o-index-html
python3 -m http.server 8000
```

Depois acesse **http://localhost:8000** no navegador.

**Com Node.js** (se você já tiver Node instalado):

```bash
cd pasta-onde-esta-o-index-html
npx serve
```

O terminal vai mostrar o endereço local (geralmente `http://localhost:3000`).

**Com VS Code**: instale a extensão "Live Server", clique com o botão direito no `index.html` e escolha "Open with Live Server".

Qualquer uma das três opções resolve o ponto de atenção da Opção 1, já que a página passa a ser servida por HTTP, não aberta como arquivo local.

## Sem instalação nenhuma

Se preferir não baixar nada, o painel também está disponível diretamente em:

👉 https://py2vox.github.io/propagacao/

## Dúvidas comuns

**"Uma aba específica não carrega dado nenhum"** — normal se a fonte externa correspondente estiver temporariamente fora do ar; cada card informa quando isso acontece, sem travar o resto do painel.

**"O mapa mundial não aparece"** — verifique sua conexão; ele carrega um arquivo de topologia (~100KB) de uma CDN externa na primeira vez.

**"Quero usar offline, sem internet"** — não é possível: todos os dados (clima espacial, meteorologia, radar) vêm de APIs públicas ao vivo. O arquivo em si não precisa de instalação, mas precisa de internet pra mostrar dado real.
