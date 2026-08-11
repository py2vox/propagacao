# Como contribuir com o AGHIP — Analisador de Propagação HF/VHF/EME

Antes de mais nada, obrigado por considerar contribuir com este projeto! Toda contribuição — relatório de bug, sugestão de funcionalidade, correção de física, ou revisão de dado — é bem-vinda.

Este documento explica como contribuir. Como o projeto é um único arquivo HTML sem processo de build, o fluxo é mais simples do que em projetos com framework.

## Código de Conduta

Este projeto e todos que participam dele seguem nosso Código de Conduta. Ao contribuir, espera-se que você o respeite, mantendo um ambiente cordial para todos.

## Como você pode contribuir

Nem toda contribuição envolve escrever código.

- **Relatar bugs**: se algo se comportar de forma inesperada (um cálculo errado, uma API que parou de responder, um problema visual), abra uma *Issue* com o máximo de detalhe possível — o que você esperava ver, o que apareceu, e se possível, em qual navegador/tema (claro ou escuro).
- **Sugerir melhorias**: tem uma ideia de funcionalidade nova ou um ajuste em algo existente? Abra uma *Issue* descrevendo a sugestão.
- **Revisar física ou fontes de dados**: como o projeto se baseia em modelos de propagação HF/VHF/EME, correções fundamentadas em literatura (com fonte citada) são especialmente bem-vindas — mesmo sem código, um comentário numa *Issue* apontando uma imprecisão já ajuda.
- **Escrever código**: para corrigir um bug ou implementar algo novo, envie um *Pull Request*.

## Seu primeiro Pull Request

### 1. Preparando seu ambiente

Não há instalação, dependências ou build. O projeto inteiro é um único arquivo `index.html` com HTML, CSS e JavaScript puro.

1. Faça um *Fork* do repositório clicando em "Fork" no canto superior direito da página.
2. Clone o seu fork para a máquina local (troque `SEU_USUARIO` pelo seu usuário do GitHub):
   ```bash
   git clone https://github.com/SEU_USUARIO/propagacao.git
   cd propagacao
   ```
3. Abra `index.html` diretamente no navegador (duplo clique, ou arraste para uma aba) para ver o estado atual do projeto.

Não é necessário `npm install`, servidor de desenvolvimento, nem nenhuma variável de ambiente ou chave de API — o projeto não faz nenhuma chamada a serviços de IA em tempo de execução; todas as chamadas são para APIs públicas e gratuitas (NOAA, INMET, Open-Meteo, RainViewer, WSPR.live, OpenStreetMap/Nominatim), sem necessidade de autenticação.

### 2. Fazendo suas alterações

- Edite `index.html` diretamente no seu editor de preferência.
- Para ver o resultado, salve o arquivo e recarregue a aba do navegador onde ele está aberto.
- Use o Console de Desenvolvedor do navegador (F12) para verificar erros de JavaScript — não há linter configurado no projeto; a validação principal é abrir o console e testar manualmente as abas afetadas pela sua mudança (Mapa, HF, VHF, EME, Meteorologia).
- Se sua mudança envolver uma fórmula ou constante física, inclua no código um comentário citando a fonte (norma ITU-R, artigo, ou referência equivalente) — é o padrão já seguido no restante do arquivo.
- Teste, quando possível, nos dois temas (claro e escuro) e em pelo menos uma largura de tela estreita (mobile), já que o painel é usado nos dois contextos.

### 3. Processo de Pull Request

1. **Crie um branch descritivo** a partir do `main` do seu fork:
   ```bash
   git checkout -b feat/adiciona-grafico-comparativo
   # ou
   git checkout -b fix/corrige-calculo-muf
   ```
2. **Faça o commit** com uma mensagem clara. Recomendamos o padrão [Conventional Commits](https://www.conventionalcommits.org/):
   ```bash
   git commit -m "fix: corrige absorção de camada D em caminhos mistos dia/noite"
   ```
   Tipos comuns: `feat` (funcionalidade nova), `fix` (correção de bug), `docs` (documentação), `style` (formatação/visual), `refactor` (reorganização de código sem mudar comportamento).
3. **Envie o branch** para o seu fork:
   ```bash
   git push origin feat/adiciona-grafico-comparativo
   ```
4. **Abra o Pull Request** na página do repositório original — o GitHub vai sugerir automaticamente a abertura a partir do seu branch recém-enviado. Descreva claramente o que mudou e por quê, incluindo a fonte, se a mudança for de física/dado.

## Guia de estilo

- O projeto é HTML/CSS/JavaScript puro — sem framework, sem TypeScript, sem etapa de compilação. Mantenha esse padrão em novas contribuições.
- Siga a formatação já usada no arquivo (indentação, nomes de função em inglês, comentários explicando a origem de fórmulas e constantes).
- Para cores de interface, use as variáveis CSS já definidas em `:root` (`--good`, `--warn`, `--bad`, `--status-*`) em vez de valores hexadecimais soltos — isso mantém o suporte a tema claro/escuro consistente.

## Licença

Ao contribuir, você concorda que sua contribuição será licenciada sob os mesmos termos do projeto. Consulte o arquivo de licença na raiz do repositório.
