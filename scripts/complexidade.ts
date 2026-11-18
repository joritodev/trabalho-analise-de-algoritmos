/**
 * Teste empírico de complexidade TEMPORAL e ESPACIAL das três abordagens.
 *
 * Para cada algoritmo:
 *   - conta a operação elementar e compara com a fórmula exata do pior caso;
 *   - mede o tempo real e verifica o fator de crescimento ao dobrar n;
 *   - mede a memória de trabalho (células/quadros de pilha) e os BYTES reais
 *     alocados, lidos de process.memoryUsage() no instante de pico.
 *
 * Executar:  npm run test:complexidade
 * Saída:     tabelas no terminal + docs/resultados-complexidade.md
 */
import { writeFileSync } from "node:fs";
import {
  naiveCallCount,
  naiveRecursive,
  ukkonenBounded,
  wagnerFischerFull,
  wagnerFischerTwoRows,
  type MemoryProbe,
} from "../src/lib/levenshtein.ts";

const gc = (globalThis as { gc?: () => void }).gc;
if (!gc) throw new Error("Execute com --expose-gc (use: npm run test:complexidade).");

// ───────────────────────────── utilitários ─────────────────────────────

const ALPHABET = "abcdefghijklmnopqrstuvwxyz";
const randomWord = (n: number) => Array.from({ length: n }, () => ALPHABET[Math.floor(Math.random() * 26)]).join("");

/** Tempo médio por execução em ms, repetindo até somar ~150 ms (mínimo 3 execuções). */
function timeMs(fn: () => unknown): number {
  fn(); // aquecimento (JIT)
  let reps = 0;
  const t0 = performance.now();
  do {
    fn();
    reps++;
  } while (performance.now() - t0 < 150 || reps < 3);
  return (performance.now() - t0) / reps;
}

/** Bytes de ArrayBuffer vivos no pico, acima da linha de base. */
function measureBytes(run: (probe: MemoryProbe) => unknown): number {
  // Com --single-threaded-gc a liberação de ArrayBuffers é síncrona: depois de
  // duas coletas completas a linha de base não contém lixo de medições antigas.
  gc!();
  gc!();
  const base = process.memoryUsage().arrayBuffers;
  let peak = 0;
  run(() => {
    peak = process.memoryUsage().arrayBuffers - base;
  });
  return peak;
}

const fmt = (x: number, d = 2) => x.toLocaleString("pt-BR", { maximumFractionDigits: d, minimumFractionDigits: d });
const int = (x: number) => x.toLocaleString("pt-BR");
const kb = (b: number) => (b < 1024 * 1024 ? `${fmt(b / 1024, 1)} KB` : `${fmt(b / 1024 / 1024, 2)} MB`);

let failures = 0;
const checks: string[] = [];
function check(ok: boolean, label: string) {
  checks.push(`${ok ? "✅" : "❌"} ${label}`);
  if (!ok) failures++;
}

const md: string[] = [
  "# Resultados do teste de complexidade",
  "",
  `Gerado por \`npm run test:complexidade\` em ${new Date().toISOString().slice(0, 10)} · Node ${process.version} (V8).`,
  "Tempos variam com a máquina; contagens e memória são determinísticas.",
  "",
];
function table(title: string, head: string[], rows: (string | number)[][]) {
  console.log(`\n${title}`);
  console.table(rows.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i]]))));
  md.push(`## ${title}`, "", `| ${head.join(" | ")} |`, `|${head.map(() => "---:").join("|")}|`);
  rows.forEach((r) => md.push(`| ${r.join(" | ")} |`));
  md.push("");
}

// ───────────────────── 1. Recursão ingênua ─────────────────────

{
  const rows: (string | number)[][] = [];
  let prevT = 0;
  let prevMs = 0;
  for (let n = 4; n <= 11; n++) {
    const a = randomWord(n), b = randomWord(n);
    const r = naiveRecursive(a, b, 1e12);
    const T = naiveCallCount(n, n);
    const ms = n <= 8 ? timeMs(() => naiveRecursive(a, b, 1e12)) : (() => { const t0 = performance.now(); naiveRecursive(a, b, 1e12); return performance.now() - t0; })();
    check(r.ops === T, `Recursão n=${n}: chamadas medidas (${int(r.ops)}) = fórmula T(n,n)`);
    check(4 ** n / (2 * n + 1) <= r.ops && r.ops <= 9 ** n, `Recursão n=${n}: 4ⁿ/(2n+1) ≤ T ≤ 9ⁿ (Teoremas 1 e 2)`);
    check(r.memory === 2 * n, `Recursão n=${n}: profundidade máxima da pilha = m + n = ${2 * n}`);
    rows.push([n, int(r.ops), prevT ? fmt(r.ops / prevT, 3) : "—", fmt(ms, ms < 1 ? 3 : 1), prevMs ? fmt(ms / prevMs, 1) : "—", r.memory, "Θ(m+n)"]);
    prevT = r.ops;
    prevMs = ms;
  }
  // Espaço independe do conteúdo e cresce linearmente também com m ≠ n.
  for (const [m, n] of [[3, 9], [9, 3], [6, 0], [10, 1]]) {
    const r = naiveRecursive(randomWord(m), randomWord(n), 1e12);
    const expected = m === 0 || n === 0 ? 1 : m + n;
    check(r.memory === expected, `Recursão m=${m}, n=${n}: profundidade = ${expected}`);
  }
  table(
    "1. Recursão ingênua (qualquer entrada é pior caso)",
    ["n", "chamadas T(n)", "T(n)/T(n−1)", "tempo (ms)", "tempo(n)/tempo(n−1)", "pilha (quadros)", "espaço"],
    rows,
  );
}

// ───────────────────── 2. Wagner-Fischer ─────────────────────

const NS = [250, 500, 1000, 2000, 4000];
{
  const rows: (string | number)[][] = [];
  let prev: { ms: number; full: number; two: number } | null = null;
  for (const n of NS) {
    const a = randomWord(n), b = randomWord(n);
    const full = wagnerFischerFull(a, b);
    const two = wagnerFischerTwoRows(a, b);
    check(full.distance === two.distance, `WF n=${n}: matriz completa e duas linhas dão a mesma distância`);
    check(two.ops === n * n, `WF n=${n}: células calculadas = n² = ${int(n * n)}`);
    check(full.memory === (n + 1) ** 2, `WF n=${n}: matriz completa aloca (n+1)² células`);
    check(two.memory === 2 * (n + 1), `WF n=${n}: duas linhas alocam 2(n+1) células`);
    const ms = timeMs(() => wagnerFischerTwoRows(a, b));
    const fullBytes = measureBytes((p) => wagnerFischerFull(a, b, p));
    const twoBytes = measureBytes((p) => wagnerFischerTwoRows(a, b, p));
    check(Math.abs(fullBytes - 4 * full.memory) / (4 * full.memory) < 0.05, `WF n=${n}: bytes reais da matriz ≈ 4 B × células (${kb(fullBytes)})`);
    check(Math.abs(twoBytes - 4 * two.memory) / (4 * two.memory) < 0.05, `WF n=${n}: bytes reais das duas linhas ≈ 4 B × células (${kb(twoBytes)})`);
    if (prev) {
      check(ms / prev.ms > 2.5 && ms / prev.ms < 6, `WF ${n / 2}→${n}: tempo multiplica ≈ 4 ao dobrar n (${fmt(ms / prev.ms, 2)}×)`);
      check(fullBytes / prev.full > 3.5 && fullBytes / prev.full < 4.5, `WF ${n / 2}→${n}: memória da matriz multiplica ≈ 4 (${fmt(fullBytes / prev.full, 2)}×)`);
      check(twoBytes / prev.two > 1.8 && twoBytes / prev.two < 2.2, `WF ${n / 2}→${n}: memória de duas linhas multiplica ≈ 2 (${fmt(twoBytes / prev.two, 2)}×)`);
    }
    rows.push([
      int(n), int(two.ops), fmt(two.ops / (n * n), 3), fmt(ms, 2), prev ? fmt(ms / prev.ms, 2) : "—",
      kb(fullBytes), prev ? fmt(fullBytes / prev.full, 2) : "—", kb(twoBytes), prev ? fmt(twoBytes / prev.two, 2) : "—",
    ]);
    prev = { ms, full: fullBytes, two: twoBytes };
  }
  table(
    "2. Wagner-Fischer (qualquer entrada é pior caso)",
    ["n", "células", "células/n²", "tempo (ms)", "×tempo", "matriz (bytes reais)", "×mem", "2 linhas (bytes reais)", "×mem"],
    rows,
  );

  // Espaço Θ(min(m, n)): fixando a palavra curta, a memória não cresce com a longa.
  const short = randomWord(200);
  const memRows: (string | number)[][] = [];
  const base = measureBytes((p) => wagnerFischerTwoRows(randomWord(500), short, p));
  for (const m of [500, 2000, 8000]) {
    const bytes = measureBytes((p) => wagnerFischerTwoRows(randomWord(m), short, p));
    check(Math.abs(bytes - base) / base < 0.05, `WF duas linhas, n = 200 fixo, m = ${m}: memória constante (${kb(bytes)})`);
    memRows.push([int(m), 200, kb(bytes), kb(measureBytes((p) => wagnerFischerFull(randomWord(m), short, p)))]);
  }
  table("2b. Espaço Θ(min(m, n)): palavra curta fixa em 200 letras", ["m (longa)", "n (curta)", "duas linhas", "matriz completa"], memRows);
}

// ───────────────────── 3. Ukkonen ─────────────────────

{
  const k = 5;
  const rows: (string | number)[][] = [];
  let prevMs = 0;
  for (const n of [1000, 2000, 4000, 8000, 16000]) {
    const a = randomWord(n);
    const r = ukkonenBounded(a, a, k); // pior caso: a = b
    const exact = (2 * k + 1) * n - k * (k + 1);
    check(r.ops === exact, `Ukkonen n=${n}, k=${k}: células = (2k+1)n − k(k+1) = ${int(exact)}`);
    const ms = timeMs(() => ukkonenBounded(a, a, k));
    const bytes = measureBytes((p) => ukkonenBounded(a, a, k, p));
    check(Math.abs(bytes - 8 * (n + 1)) / (8 * (n + 1)) < 0.05, `Ukkonen n=${n}: bytes reais ≈ 2(n+1) × 4 B (${kb(bytes)})`);
    if (prevMs) check(ms / prevMs > 1.4 && ms / prevMs < 3, `Ukkonen ${n / 2}→${n}: tempo multiplica ≈ 2 ao dobrar n (${fmt(ms / prevMs, 2)}×)`);
    const rnd = ukkonenBounded(a, randomWord(n), k);
    rows.push([int(n), int(r.ops), fmt(r.ops / ((2 * k + 1) * n), 4), fmt(ms, 3), prevMs ? fmt(ms / prevMs, 2) : "—", kb(bytes), int(rnd.ops)]);
    prevMs = ms;
  }
  table(
    `3. Ukkonen, k = ${k}, pior caso (a = b)`,
    ["n", "células", "células/((2k+1)n)", "tempo (ms)", "×tempo", "memória (bytes reais)", "células c/ entrada aleatória"],
    rows,
  );

  // Dependência em k com n fixo: custo linear em k.
  const n = 8000;
  const a = randomWord(n);
  const kRows: (string | number)[][] = [];
  for (const kk of [2, 4, 8, 16, 32]) {
    const r = ukkonenBounded(a, a, kk);
    check(r.ops === (2 * kk + 1) * n - kk * (kk + 1), `Ukkonen n=${n}, k=${kk}: contagem exata do pior caso`);
    kRows.push([kk, int(r.ops), fmt(r.ops / (kk * n), 3), fmt(timeMs(() => ukkonenBounded(a, a, kk)), 3)]);
  }
  table(`3b. Ukkonen, n = ${int(n)} fixo, variando k (pior caso)`, ["k", "células", "células/(k·n)", "tempo (ms)"], kRows);

  // Melhor caso Ω(1): diferença de tamanho > k.
  const best = ukkonenBounded(randomWord(100000), randomWord(10), 3);
  check(best.ops === 0 && best.memory === 0, "Ukkonen melhor caso: |m − n| > k ⇒ 0 células e 0 memória (Ω(1))");
}

// ───────────────────────────── resumo ─────────────────────────────

md.push("## Verificações", "", ...checks.map((c) => `- ${c}`), "", `**Resultado: ${checks.length - failures}/${checks.length} verificações passaram.**`, "");
writeFileSync(new URL("../docs/resultados-complexidade.md", import.meta.url), md.join("\n"));
console.log(`\n${checks.join("\n")}`);
console.log(`\n${failures === 0 ? "✅" : "❌"} ${checks.length - failures}/${checks.length} verificações passaram · relatório em docs/resultados-complexidade.md`);
process.exit(failures ? 1 : 0);
