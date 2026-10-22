# Levenshtein Lab

**Integrantes:** João Victor de Carvalho Montenegro e Davi Studart Fontenele

Projeto final de **Análise de Algoritmos (FB UNI)**: *Busca aproximada e correção ortográfica em tempo real: otimização da distância de Levenshtein*.

São três algoritmos, cada um com o pior caso provado no relatório e verificado empiricamente por contagem de operações:

| Abordagem | Pior caso (tempo) | Espaço |
|---|---|---|
| Recursão ingênua | Θ((3+2√2)ⁿ/√n), entre Ω(4ⁿ/n) e O(9ⁿ) | O(m+n) |
| Wagner-Fischer | Θ(m·n) | Θ(m·n), ou Θ(min(m,n)) com duas linhas |
| Ukkonen (faixa \|i−j\| ≤ k) | Θ(k·min(m,n)); melhor caso Ω(1) | Θ(min(m,n)) |

## Como rodar

Requer Node.js 18.18 ou superior.

```bash
npm install
npm run dev               # http://localhost:3000
npm run check             # testes de correção e de contagem de operações
npm run build             # exportação estática em out/ (para servidor na raiz)
npm run export:portable   # out/ com caminhos relativos (qualquer subpasta)
```

## Estrutura

```text
src/
  lib/levenshtein.ts             núcleo: algoritmos puros e instrumentados
  lib/__tests__/levenshtein.check.ts
  workers/benchmark.worker.ts    stress test fora da thread principal
  components/
    AppShell.tsx                 cabeçalho, abas e navegação por hash (#matrix, #bench, ...)
    LineChart.tsx                gráfico SVG (escala log/linear, crosshair)
    ui.tsx                       design system (painéis, sliders, stats)
    modules/
      Overview.tsx               visão geral
      MatrixSimulator.tsx        Módulo A: matriz passo a passo + backtracking
      Benchmark.tsx              Módulo B: operações × n ao vivo
      RecursionTree.tsx          Módulo C: árvore de chamadas, duplicados em vermelho
      UkkonenCut.tsx             Módulo D: slider de k e máscara diagonal
      MemoryXray.tsx             Módulo E: matriz completa × duas linhas
docs/
  relatorio.md                   fonte do relatório (Markdown + LaTeX)
  relatorio.pdf / relatorio.docx versões geradas
```

## Regenerar o relatório

```bash
cd docs
pandoc relatorio.md -o relatorio.docx
pandoc relatorio.md -s --mathml --css relatorio.css --embed-resources -o relatorio.html
# PDF: abrir relatorio.html no Chrome e imprimir em A4 ("Salvar como PDF")
```
