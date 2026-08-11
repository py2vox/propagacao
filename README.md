# propagacao

📡 AGHIP — Plataforma de Inteligência de Propagação HF/VHF/EME

Painel único de análise de propagação para radioamadores, cobrindo HF (160m–10m), VHF (6m/2m), EME (Terra-Lua-Terra), Meteor Scatter e meteorologia de estação — construído como um único arquivo HTML, sem backend, sem build, sem chaves de API.

## 🚀 Demonstração ao vivo

👉 [py2vox.github.io/propagacao](https://py2vox.github.io/propagacao/)

Basta abrir o link — não há instalação, build ou configuração necessária.

## 📡 Visão geral

Este projeto reúne, num único painel, previsões de propagação HF/VHF baseadas em física ionosférica e troposférica real, cruzadas com dados ao vivo de clima espacial e meteorologia, além de ferramentas de EME e Meteor Scatter com efemérides astronômicas calculadas localmente.

Diferente de um simulador com dados fictícios, cada número exibido vem de uma fonte real e pública, ou de uma equação com fonte citada — e cada limitação do modelo é declarada explicitamente na própria interface, não escondida.

## ✨ Funcionalidades

**Mapa** — grande círculo para 24 destinos a partir do seu QTH, greyline (terminador dia/noite) atualizado a cada minuto, melhor banda por destino nas próximas horas.

**HF (160m–10m + 11m/CB)** — heatmap de 36 horas por banda, índices solares e geomagnéticos reais (SFI, Kp, Dst, Bz, raio-X) via NOAA, MUF calibrada contra literatura de referência, absorção de camada D pelo ponto mais crítico do caminho (não a média), verificação cruzada com spots reais do WSPR, alerta de tendência de Bz para tempestades geomagnéticas.

**VHF (6m/2m)** — Esporádica-E sazonal (com pico principal e secundário confirmados na literatura), propagação transequatorial (TEP) diferenciada por banda e calibrada contra um caso real documentado, duto troposférico calculado a partir de perfil atmosférico real, calendário de chuvas de meteoros com radiante, elevação e viabilidade geométrica calculados para o seu QTH específico.

**EME (Terra-Lua-Terra)** — posição lunar com correção de paralaxe topocêntrica, ruído galáctico e solar ponderados por banda (144/432/1296MHz), janela de visibilidade comum entre duas estações quaisquer, referência de severidade de rotação de Faraday por banda.

**Meteorologia** — avisos oficiais do INMET (nacional e específico da sua região, priorizados pela relevância para uma estação de rádio — vento antes de umidade baixa, por exemplo), condições da estação e segurança de vento pela escala Beaufort, radar de precipitação, raios sobre o Brasil via sensor GLM do satélite GOES-19 processado diretamente no navegador.

## 🌐 Fontes de dados (todas públicas, sem chave de API)

| Fonte | Dado | Licença/acesso |
|---|---|---|
| NOAA SWPC | SFI, Kp, Dst, Bz, raio-X | Domínio público |
| NOAA GOES-19 (GLM) | Descargas atmosféricas | AWS Open Data / domínio público |
| INMET | Avisos meteorológicos oficiais | Domínio público |
| Open-Meteo | Condições atmosféricas e perfil vertical | CC BY 4.0 |
| RainViewer | Radar de precipitação | Uso educacional/pessoal |
| WSPR.live | Spots reais para validação cruzada | Público |
| OpenStreetMap / Nominatim | Mapas e geocodificação | ODbL |
| Blitzortung.org | Mapa de raios (EUA/Europa) | Embed público via iframe |

## 🛠️ Stack técnica

Um único arquivo HTML — sem framework, sem build, sem `npm install`.

- JavaScript puro para toda a física de propagação e integração com APIs
- [D3.js](https://d3js.org/) + [world-atlas](https://github.com/topojson/world-atlas) — mapa mundi e grande círculo
- [Leaflet](https://leafletjs.com/) — radar de precipitação e mapa de raios
- [Chart.js](https://www.chartjs.org/) — gráfico de tendência do Kp
- [h5wasm](https://github.com/usnistgov/h5wasm) (NIST) — leitura de arquivos científicos NetCDF/HDF5 (GOES-19) direto no navegador, via WebAssembly

## ⚠️ Limitações conhecidas

- Física simplificada — não substitui ferramentas como VOACAP ou WSJT-X.
- Sem infraestrutura de servidor entre sessões — cada carregamento de página começa do zero (exceto onde explicitamente indicado na própria interface).
- A calibração do modelo de SNR contra dados reais do WSPR é baseada em uma única sessão de observação; mais dados ao longo do tempo são necessários para refinar esse ajuste.
- Libração lunar exata e rotação de Faraday em tempo real não são calculadas — exigiriam fontes de dados que não estão disponíveis gratuitamente.
- O card de raios via GOES-19/GLM é a integração tecnicamente mais nova do sistema (arquivo binário científico processado direto no navegador); já confirmada em funcionamento real, mas com menos tempo de uso acumulado que as demais fontes.

Cada uma dessas limitações também aparece diretamente na interface, na seção correspondente — não é um aviso genérico à parte.

## ⚙️ Como usar localmente

Não há instalação. Basta baixar o `index.html` e abrir no navegador, ou clonar o repositório:

```bash
git clone https://github.com/py2vox/propagacao.git
cd propagacao
```

Depois, abra `index.html` diretamente no navegador (duplo clique, ou arraste para uma aba). Todas as chamadas de API acontecem no lado do cliente, sem necessidade de servidor local.

## 📄 Licença

Ver arquivo de licença do repositório. Este projeto consome exclusivamente fontes de dados públicas e gratuitas; verifique a licença de cada fonte listada acima antes de redistribuir dados extraídos do painel.
