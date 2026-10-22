/**
 * Núcleo algorítmico do projeto — Distância de Levenshtein.
 *
 * Todas as funções são puras e instrumentadas: além do resultado devolvem
 * contadores de operações (para o Módulo B) e/ou traços de execução
 * (para os Módulos A, C, D e E). Nenhuma depende de React, por isso podem
 * correr dentro de um Web Worker.
 */

// ───────────────────────────── Tipos partilhados ─────────────────────────────

export type Op = "init" | "match" | "sub" | "ins" | "del";

export interface Metrics {
  /** Número de células/chamadas avaliadas — a "operação elementar" da análise. */
  ops: number;
}

// ─────────────────────── Abordagem 1 — Recursão ingénua ──────────────────────

export interface NaiveResult extends Metrics {
  distance: number | null; // null quando o orçamento foi excedido
  aborted: boolean;
}

/**
 * lev(i, j) = distância entre os prefixos a[0..i) e b[0..j).
 * Sem memoização: a mesma (i, j) é recalculada inúmeras vezes.
 * `budget` evita congelar o browser no stress test.
 */
export function naiveRecursive(a: string, b: string, budget = 5e7): NaiveResult {
  let ops = 0;
  const ABORT = Symbol("abort");

  const lev = (i: number, j: number): number => {
    if (++ops > budget) throw ABORT;
    if (i === 0) return j;
    if (j === 0) return i;
    const cost = a[i - 1] === b[j - 1] ? 0 : 1;
    return Math.min(
      lev(i - 1, j) + 1, // deleção
      lev(i, j - 1) + 1, // inserção
      lev(i - 1, j - 1) + cost, // match / substituição
    );
  };

  try {
    return { distance: lev(a.length, b.length), ops, aborted: false };
  } catch (e) {
    if (e === ABORT) return { distance: null, ops: budget, aborted: true };
    throw e;
  }
}

/**
 * Número exato de chamadas da recursão ingénua, pela recorrência
 *   T(i, 0) = T(0, j) = 1
 *   T(i, j) = 1 + T(i-1, j) + T(i, j-1) + T(i-1, j-1)
 * calculada em O(m·n). Permite desenhar a curva exponencial no gráfico
 * para valores de n onde executar de facto seria inviável.
 */
export function naiveCallCount(m: number, n: number): number {
  let prev = new Array<number>(n + 1).fill(1);
  for (let i = 1; i <= m; i++) {
    const cur = new Array<number>(n + 1);
    cur[0] = 1;
    for (let j = 1; j <= n; j++) cur[j] = 1 + prev[j] + cur[j - 1] + prev[j - 1];
    prev = cur;
  }
  return prev[n];
}

// ───────────────── Módulo C — Árvore de recorrência (ingénua) ─────────────────

export interface TreeNode {
  id: number;
  i: number;
  j: number;
  depth: number;
  parent: number | null;
  /** true se (i, j) já tinha sido visitado noutro ramo — recomputação. */
  duplicate: boolean;
  children: number[];
}

/** Expande a árvore de chamadas (DFS, mesma ordem do algoritmo) até `maxNodes`. */
export function buildRecursionTree(a: string, b: string, maxNodes = 400): TreeNode[] {
  const nodes: TreeNode[] = [];
  const seen = new Set<string>();

  const visit = (i: number, j: number, depth: number, parent: number | null) => {
    if (nodes.length >= maxNodes) return;
    const key = `${i},${j}`;
    const node: TreeNode = { id: nodes.length, i, j, depth, parent, duplicate: seen.has(key), children: [] };
    seen.add(key);
    nodes.push(node);
    if (parent !== null) nodes[parent].children.push(node.id);
    if (i === 0 || j === 0) return;
    visit(i - 1, j, depth + 1, node.id);
    visit(i, j - 1, depth + 1, node.id);
    visit(i - 1, j - 1, depth + 1, node.id);
  };

  visit(a.length, b.length, 0, null);
  return nodes;
}

// ────────────── Abordagem 2 — Wagner-Fischer (matriz completa) ───────────────

export interface CellStep {
  i: number;
  j: number;
  value: number;
  op: Op;
}

export interface WagnerFischerTrace extends Metrics {
  distance: number;
  matrix: number[][];
  /** Ordem de preenchimento linha a linha — alimenta o Play/Step do Módulo A. */
  steps: CellStep[];
  /** Caminho ótimo de (0,0) até (m,n), obtido por backtracking. */
  path: CellStep[];
}

export function wagnerFischerTrace(a: string, b: string): WagnerFischerTrace {
  const m = a.length;
  const n = b.length;
  const D: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  const steps: CellStep[] = [];

  for (let i = 0; i <= m; i++) {
    D[i][0] = i;
    steps.push({ i, j: 0, value: i, op: "init" });
  }
  for (let j = 1; j <= n; j++) {
    D[0][j] = j;
    steps.push({ i: 0, j, value: j, op: "init" });
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const same = a[i - 1] === b[j - 1];
      const diag = D[i - 1][j - 1] + (same ? 0 : 1);
      const del = D[i - 1][j] + 1;
      const ins = D[i][j - 1] + 1;
      const value = Math.min(diag, del, ins);
      // Desempate preferindo a diagonal: produz alinhamentos mais legíveis.
      const op: Op = value === diag ? (same ? "match" : "sub") : value === del ? "del" : "ins";
      D[i][j] = value;
      steps.push({ i, j, value, op });
    }
  }

  return { distance: D[m][n], matrix: D, steps, path: backtrack(a, b, D), ops: m * n };
}

function backtrack(a: string, b: string, D: number[][]): CellStep[] {
  const path: CellStep[] = [];
  let i = a.length;
  let j = b.length;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0) {
      const same = a[i - 1] === b[j - 1];
      if (D[i][j] === D[i - 1][j - 1] + (same ? 0 : 1)) {
        path.push({ i, j, value: D[i][j], op: same ? "match" : "sub" });
        i--; j--;
        continue;
      }
    }
    if (i > 0 && D[i][j] === D[i - 1][j] + 1) {
      path.push({ i, j, value: D[i][j], op: "del" });
      i--;
    } else {
      path.push({ i, j, value: D[i][j], op: "ins" });
      j--;
    }
  }
  path.push({ i: 0, j: 0, value: 0, op: "init" });
  return path.reverse();
}

// ─────────── Abordagem 2b — Wagner-Fischer com espaço Θ(min(m, n)) ───────────

export interface DistanceResult extends Metrics {
  distance: number;
  /** Inteiros mantidos em memória em simultâneo (para o Módulo E). */
  cellsInMemory: number;
}

export function wagnerFischerTwoRows(a: string, b: string): DistanceResult {
  // Garante que as linhas têm o comprimento da string MAIS CURTA.
  if (b.length > a.length) [a, b] = [b, a];
  const m = a.length;
  const n = b.length;
  let prev = new Uint32Array(n + 1);
  let cur = new Uint32Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;

  for (let i = 1; i <= m; i++) {
    cur[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, cur] = [cur, prev];
  }
  return { distance: prev[n], ops: m * n, cellsInMemory: 2 * (n + 1) };
}

// ───────── Abordagem 3 — Ukkonen: faixa diagonal limitada por k ──────────

export interface BoundedResult extends Metrics {
  /** null significa "distância > k" (rejeitado). */
  distance: number | null;
  cutReason: "length-gap" | "row-min" | null;
}

/**
 * Só as células com |i - j| ≤ k podem ter valor ≤ k, porque sair da
 * diagonal principal custa no mínimo |i - j| inserções/deleções.
 * Custo: O(k · min(m, n)); Ω(1) quando | |a| - |b| | > k.
 */
export function ukkonenBounded(a: string, b: string, k: number): BoundedResult {
  if (b.length > a.length) [a, b] = [b, a];
  const m = a.length;
  const n = b.length;
  if (m - n > k) return { distance: null, ops: 0, cutReason: "length-gap" };

  const INF = k + 1; // qualquer valor > k é equivalente a "infinito"
  let prev = new Array<number>(n + 1).fill(INF);
  let cur = new Array<number>(n + 1).fill(INF);
  for (let j = 0; j <= Math.min(n, k); j++) prev[j] = j;
  let ops = 0;

  for (let i = 1; i <= m; i++) {
    const lo = Math.max(1, i - k);
    const hi = Math.min(n, i + k);
    // Só a borda esquerda da faixa precisa ser reiniciada (contém lixo de duas
    // linhas atrás). A borda direita prev[i+k] nunca foi escrita, logo vale INF.
    // Um cur.fill(INF) aqui custaria O(n) por linha e destruiria o O(k·n).
    if (lo - 1 >= 1) cur[lo - 1] = INF;
    cur[0] = i <= k ? i : INF;
    let rowMin = cur[0];
    for (let j = lo; j <= hi; j++) {
      ops++;
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost, INF);
      cur[j] = v;
      if (v < rowMin) rowMin = v;
    }
    // Os valores ao longo de qualquer caminho nunca decrescem: se a linha
    // inteira já ultrapassou k, a resposta final também ultrapassa.
    if (rowMin > k) return { distance: null, ops, cutReason: "row-min" };
    [prev, cur] = [cur, prev];
  }
  const d = prev[n];
  return { distance: d <= k ? d : null, ops, cutReason: d <= k ? null : "row-min" };
}

/** Máscara booleana da faixa |i - j| ≤ k — sobreposta à matriz no Módulo D. */
export function ukkonenBandMask(m: number, n: number, k: number): boolean[][] {
  return Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => Math.abs(i - j) <= k),
  );
}

// ─────────────────────── Módulo E — Raio-X de memória ───────────────────────

export interface MemoryReport {
  fullCells: number;
  twoRowCells: number;
  fullBytes: number;
  twoRowBytes: number;
  savingPercent: number;
}

export function memoryReport(m: number, n: number, bytesPerCell = 4): MemoryReport {
  const fullCells = (m + 1) * (n + 1);
  const twoRowCells = 2 * (Math.min(m, n) + 1);
  return {
    fullCells,
    twoRowCells,
    fullBytes: fullCells * bytesPerCell,
    twoRowBytes: twoRowCells * bytesPerCell,
    savingPercent: 100 * (1 - twoRowCells / fullCells),
  };
}

// ──────────── Módulo D — Ukkonen rastreado (sem trocar as strings) ────────────

export type BandCell =
  | { kind: "computed"; value: number } // calculada dentro da faixa
  | { kind: "skipped" } // fora da faixa |i - j| > k: nunca calculada
  | { kind: "abandoned" }; // dentro da faixa, mas após o corte antecipado

export interface UkkonenTrace extends BoundedResult {
  cells: BandCell[][];
  /** Linha em que o algoritmo desistiu (corte por row-min), se houver. */
  cutRow: number | null;
}

export function ukkonenTrace(a: string, b: string, k: number): UkkonenTrace {
  const m = a.length;
  const n = b.length;
  const INF = k + 1;
  const cells: BandCell[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j): BandCell =>
      Math.abs(i - j) <= k ? { kind: "abandoned" } : { kind: "skipped" },
    ),
  );
  if (Math.abs(m - n) > k) return { distance: null, ops: 0, cutReason: "length-gap", cells, cutRow: 0 };

  const D: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(INF));
  for (let j = 0; j <= Math.min(n, k); j++) {
    D[0][j] = j;
    cells[0][j] = { kind: "computed", value: j };
  }
  let ops = 0;
  for (let i = 1; i <= m; i++) {
    let rowMin = INF;
    if (i <= k) {
      D[i][0] = i;
      cells[i][0] = { kind: "computed", value: i };
      rowMin = i;
    }
    for (let j = Math.max(1, i - k); j <= Math.min(n, i + k); j++) {
      ops++;
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const v = Math.min(D[i - 1][j] + 1, D[i][j - 1] + 1, D[i - 1][j - 1] + cost, INF);
      D[i][j] = v;
      cells[i][j] = { kind: "computed", value: v };
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > k) return { distance: null, ops, cutReason: "row-min", cells, cutRow: i };
  }
  const d = D[m][n];
  return { distance: d <= k ? d : null, ops, cutReason: d <= k ? null : "row-min", cells, cutRow: null };
}
