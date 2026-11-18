# Resultados do teste de complexidade

Gerado por `npm run test:complexidade` em 2026-11-18 · Node v22.22.0 (V8).
Tempos variam com a máquina; contagens e memória são determinísticas.

## 1. Recursão ingênua (qualquer entrada é pior caso)

| n | chamadas T(n) | T(n)/T(n−1) | tempo (ms) | tempo(n)/tempo(n−1) | pilha (quadros) | espaço |
|---:|---:|---:|---:|---:|---:|---:|
| 4 | 481 | — | 0,005 | — | 8 | Θ(m+n) |
| 5 | 2.524 | 5,247 | 0,022 | 4,8 | 10 | Θ(m+n) |
| 6 | 13.483 | 5,342 | 0,113 | 5,2 | 12 | Θ(m+n) |
| 7 | 72.958 | 5,411 | 0,629 | 5,6 | 14 | Θ(m+n) |
| 8 | 398.593 | 5,463 | 3,7 | 5,9 | 16 | Θ(m+n) |
| 9 | 2.193.844 | 5,504 | 18,4 | 5,0 | 18 | Θ(m+n) |
| 10 | 12.146.179 | 5,536 | 103,0 | 5,6 | 20 | Θ(m+n) |
| 11 | 67.570.078 | 5,563 | 565,1 | 5,5 | 22 | Θ(m+n) |

## 2. Wagner-Fischer (qualquer entrada é pior caso)

| n | células | células/n² | tempo (ms) | ×tempo | matriz (bytes reais) | ×mem | 2 linhas (bytes reais) | ×mem |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 250 | 62.500 | 1,000 | 0,44 | — | 246,1 KB | — | 2,0 KB | — |
| 500 | 250.000 | 1,000 | 2,11 | 4,80 | 980,5 KB | 3,98 | 3,9 KB | 2,00 |
| 1.000 | 1.000.000 | 1,000 | 10,57 | 5,02 | 3,82 MB | 3,99 | 7,8 KB | 2,00 |
| 2.000 | 4.000.000 | 1,000 | 31,26 | 2,96 | 15,27 MB | 4,00 | 15,6 KB | 2,00 |
| 4.000 | 16.000.000 | 1,000 | 124,13 | 3,97 | 61,07 MB | 4,00 | 31,3 KB | 2,00 |

## 2b. Espaço Θ(min(m, n)): palavra curta fixa em 200 letras

| m (longa) | n (curta) | duas linhas | matriz completa |
|---:|---:|---:|---:|
| 500 | 200 | 1,6 KB | 393,4 KB |
| 2.000 | 200 | 1,6 KB | 1,53 MB |
| 8.000 | 200 | 1,6 KB | 6,13 MB |

## 3. Ukkonen, k = 5, pior caso (a = b)

| n | células | células/((2k+1)n) | tempo (ms) | ×tempo | memória (bytes reais) | células c/ entrada aleatória |
|---:|---:|---:|---:|---:|---:|---:|
| 1.000 | 10.970 | 0,9973 | 0,087 | — | 7,8 KB | 73 |
| 2.000 | 21.970 | 0,9986 | 0,182 | 2,09 | 15,6 KB | 62 |
| 4.000 | 43.970 | 0,9993 | 0,343 | 1,89 | 31,3 KB | 51 |
| 8.000 | 87.970 | 0,9997 | 0,832 | 2,43 | 62,5 KB | 62 |
| 16.000 | 175.970 | 0,9998 | 1,330 | 1,60 | 125,0 KB | 51 |

## 3b. Ukkonen, n = 8.000 fixo, variando k (pior caso)

| k | células | células/(k·n) | tempo (ms) |
|---:|---:|---:|---:|
| 2 | 39.994 | 2,500 | 0,329 |
| 4 | 71.980 | 2,249 | 0,825 |
| 8 | 135.928 | 2,124 | 1,481 |
| 16 | 263.728 | 2,060 | 2,435 |
| 32 | 518.944 | 2,027 | 4,804 |

## Verificações

- ✅ Recursão n=4: chamadas medidas (481) = fórmula T(n,n)
- ✅ Recursão n=4: 4ⁿ/(2n+1) ≤ T ≤ 9ⁿ (Teoremas 1 e 2)
- ✅ Recursão n=4: profundidade máxima da pilha = m + n = 8
- ✅ Recursão n=5: chamadas medidas (2.524) = fórmula T(n,n)
- ✅ Recursão n=5: 4ⁿ/(2n+1) ≤ T ≤ 9ⁿ (Teoremas 1 e 2)
- ✅ Recursão n=5: profundidade máxima da pilha = m + n = 10
- ✅ Recursão n=6: chamadas medidas (13.483) = fórmula T(n,n)
- ✅ Recursão n=6: 4ⁿ/(2n+1) ≤ T ≤ 9ⁿ (Teoremas 1 e 2)
- ✅ Recursão n=6: profundidade máxima da pilha = m + n = 12
- ✅ Recursão n=7: chamadas medidas (72.958) = fórmula T(n,n)
- ✅ Recursão n=7: 4ⁿ/(2n+1) ≤ T ≤ 9ⁿ (Teoremas 1 e 2)
- ✅ Recursão n=7: profundidade máxima da pilha = m + n = 14
- ✅ Recursão n=8: chamadas medidas (398.593) = fórmula T(n,n)
- ✅ Recursão n=8: 4ⁿ/(2n+1) ≤ T ≤ 9ⁿ (Teoremas 1 e 2)
- ✅ Recursão n=8: profundidade máxima da pilha = m + n = 16
- ✅ Recursão n=9: chamadas medidas (2.193.844) = fórmula T(n,n)
- ✅ Recursão n=9: 4ⁿ/(2n+1) ≤ T ≤ 9ⁿ (Teoremas 1 e 2)
- ✅ Recursão n=9: profundidade máxima da pilha = m + n = 18
- ✅ Recursão n=10: chamadas medidas (12.146.179) = fórmula T(n,n)
- ✅ Recursão n=10: 4ⁿ/(2n+1) ≤ T ≤ 9ⁿ (Teoremas 1 e 2)
- ✅ Recursão n=10: profundidade máxima da pilha = m + n = 20
- ✅ Recursão n=11: chamadas medidas (67.570.078) = fórmula T(n,n)
- ✅ Recursão n=11: 4ⁿ/(2n+1) ≤ T ≤ 9ⁿ (Teoremas 1 e 2)
- ✅ Recursão n=11: profundidade máxima da pilha = m + n = 22
- ✅ Recursão m=3, n=9: profundidade = 12
- ✅ Recursão m=9, n=3: profundidade = 12
- ✅ Recursão m=6, n=0: profundidade = 1
- ✅ Recursão m=10, n=1: profundidade = 11
- ✅ WF n=250: matriz completa e duas linhas dão a mesma distância
- ✅ WF n=250: células calculadas = n² = 62.500
- ✅ WF n=250: matriz completa aloca (n+1)² células
- ✅ WF n=250: duas linhas alocam 2(n+1) células
- ✅ WF n=250: bytes reais da matriz ≈ 4 B × células (246,1 KB)
- ✅ WF n=250: bytes reais das duas linhas ≈ 4 B × células (2,0 KB)
- ✅ WF n=500: matriz completa e duas linhas dão a mesma distância
- ✅ WF n=500: células calculadas = n² = 250.000
- ✅ WF n=500: matriz completa aloca (n+1)² células
- ✅ WF n=500: duas linhas alocam 2(n+1) células
- ✅ WF n=500: bytes reais da matriz ≈ 4 B × células (980,5 KB)
- ✅ WF n=500: bytes reais das duas linhas ≈ 4 B × células (3,9 KB)
- ✅ WF 250→500: tempo multiplica ≈ 4 ao dobrar n (4,80×)
- ✅ WF 250→500: memória da matriz multiplica ≈ 4 (3,98×)
- ✅ WF 250→500: memória de duas linhas multiplica ≈ 2 (2,00×)
- ✅ WF n=1000: matriz completa e duas linhas dão a mesma distância
- ✅ WF n=1000: células calculadas = n² = 1.000.000
- ✅ WF n=1000: matriz completa aloca (n+1)² células
- ✅ WF n=1000: duas linhas alocam 2(n+1) células
- ✅ WF n=1000: bytes reais da matriz ≈ 4 B × células (3,82 MB)
- ✅ WF n=1000: bytes reais das duas linhas ≈ 4 B × células (7,8 KB)
- ✅ WF 500→1000: tempo multiplica ≈ 4 ao dobrar n (5,02×)
- ✅ WF 500→1000: memória da matriz multiplica ≈ 4 (3,99×)
- ✅ WF 500→1000: memória de duas linhas multiplica ≈ 2 (2,00×)
- ✅ WF n=2000: matriz completa e duas linhas dão a mesma distância
- ✅ WF n=2000: células calculadas = n² = 4.000.000
- ✅ WF n=2000: matriz completa aloca (n+1)² células
- ✅ WF n=2000: duas linhas alocam 2(n+1) células
- ✅ WF n=2000: bytes reais da matriz ≈ 4 B × células (15,27 MB)
- ✅ WF n=2000: bytes reais das duas linhas ≈ 4 B × células (15,6 KB)
- ✅ WF 1000→2000: tempo multiplica ≈ 4 ao dobrar n (2,96×)
- ✅ WF 1000→2000: memória da matriz multiplica ≈ 4 (4,00×)
- ✅ WF 1000→2000: memória de duas linhas multiplica ≈ 2 (2,00×)
- ✅ WF n=4000: matriz completa e duas linhas dão a mesma distância
- ✅ WF n=4000: células calculadas = n² = 16.000.000
- ✅ WF n=4000: matriz completa aloca (n+1)² células
- ✅ WF n=4000: duas linhas alocam 2(n+1) células
- ✅ WF n=4000: bytes reais da matriz ≈ 4 B × células (61,07 MB)
- ✅ WF n=4000: bytes reais das duas linhas ≈ 4 B × células (31,3 KB)
- ✅ WF 2000→4000: tempo multiplica ≈ 4 ao dobrar n (3,97×)
- ✅ WF 2000→4000: memória da matriz multiplica ≈ 4 (4,00×)
- ✅ WF 2000→4000: memória de duas linhas multiplica ≈ 2 (2,00×)
- ✅ WF duas linhas, n = 200 fixo, m = 500: memória constante (1,6 KB)
- ✅ WF duas linhas, n = 200 fixo, m = 2000: memória constante (1,6 KB)
- ✅ WF duas linhas, n = 200 fixo, m = 8000: memória constante (1,6 KB)
- ✅ Ukkonen n=1000, k=5: células = (2k+1)n − k(k+1) = 10.970
- ✅ Ukkonen n=1000: bytes reais ≈ 2(n+1) × 4 B (7,8 KB)
- ✅ Ukkonen n=2000, k=5: células = (2k+1)n − k(k+1) = 21.970
- ✅ Ukkonen n=2000: bytes reais ≈ 2(n+1) × 4 B (15,6 KB)
- ✅ Ukkonen 1000→2000: tempo multiplica ≈ 2 ao dobrar n (2,09×)
- ✅ Ukkonen n=4000, k=5: células = (2k+1)n − k(k+1) = 43.970
- ✅ Ukkonen n=4000: bytes reais ≈ 2(n+1) × 4 B (31,3 KB)
- ✅ Ukkonen 2000→4000: tempo multiplica ≈ 2 ao dobrar n (1,89×)
- ✅ Ukkonen n=8000, k=5: células = (2k+1)n − k(k+1) = 87.970
- ✅ Ukkonen n=8000: bytes reais ≈ 2(n+1) × 4 B (62,5 KB)
- ✅ Ukkonen 4000→8000: tempo multiplica ≈ 2 ao dobrar n (2,43×)
- ✅ Ukkonen n=16000, k=5: células = (2k+1)n − k(k+1) = 175.970
- ✅ Ukkonen n=16000: bytes reais ≈ 2(n+1) × 4 B (125,0 KB)
- ✅ Ukkonen 8000→16000: tempo multiplica ≈ 2 ao dobrar n (1,60×)
- ✅ Ukkonen n=8000, k=2: contagem exata do pior caso
- ✅ Ukkonen n=8000, k=4: contagem exata do pior caso
- ✅ Ukkonen n=8000, k=8: contagem exata do pior caso
- ✅ Ukkonen n=8000, k=16: contagem exata do pior caso
- ✅ Ukkonen n=8000, k=32: contagem exata do pior caso
- ✅ Ukkonen melhor caso: |m − n| > k ⇒ 0 células e 0 memória (Ω(1))

**Resultado: 93/93 verificações passaram.**
