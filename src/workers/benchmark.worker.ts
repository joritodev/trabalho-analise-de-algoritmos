/// <reference lib="webworker" />
/**
 * Stress test executado fora da thread principal: mesmo quando a recursão
 * ingénua "trava", a interface continua a responder.
 */
import { naiveCallCount, naiveRecursive, ukkonenBounded, wagnerFischerTwoRows } from "@/lib/levenshtein";

export type InputMode = "random" | "worst";

export interface BenchRequest {
  /** Tamanhos de palavra a medir, em ordem crescente. */
  ns: number[];
  k: number;
  mode: InputMode;
  /** Máximo de chamadas que a recursão pode fazer antes de ser abortada. */
  naiveBudget: number;
}

export interface BenchPoint {
  n: number;
  /** null quando n é grande demais até para prever (fase de grande escala). */
  naive: { ops: number; ms: number; aborted: boolean; predicted: number } | null;
  wf: { ops: number; ms: number };
  uk: { ops: number; ms: number; distance: number | null };
}

export type BenchMessage =
  | { type: "progress"; n: number; phase: "naive" | "wf" | "uk" }
  | { type: "point"; point: BenchPoint }
  | { type: "done" };

const ALPHABET = "abcdefghijklmnopqrstuvwxyz";
const randomWord = (n: number) =>
  Array.from({ length: n }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join("");

/** Repete fn até acumular ~4 ms, para medir algoritmos rápidos com precisão. */
function timeIt<T>(fn: () => T): { result: T; ms: number } {
  let reps = 0;
  let result!: T;
  const t0 = performance.now();
  let elapsed = 0;
  do {
    result = fn();
    reps++;
    elapsed = performance.now() - t0;
  } while (elapsed < 4 && reps < 10_000);
  return { result, ms: elapsed / reps };
}

self.onmessage = (e: MessageEvent<BenchRequest>) => {
  const { ns, k, mode, naiveBudget } = e.data;
  let naiveDead = false;
  const post = (msg: BenchMessage) => self.postMessage(msg);

  for (const n of ns) {
    // Recursão e Wagner-Fischer custam o mesmo para qualquer entrada de tamanho n;
    // para o Ukkonen o pior caso são strings idênticas (nenhum corte antecipado).
    const a = randomWord(n);
    const b = mode === "worst" ? a : randomWord(n);
    let naive: BenchPoint["naive"] = null;
    const predicted = n <= 60 ? naiveCallCount(n, n) : Infinity;

    post({ type: "progress", n, phase: "naive" });
    if (!Number.isFinite(predicted)) {
      naive = null;
    } else if (naiveDead || predicted > naiveBudget) {
      naiveDead = true;
      naive = { ops: predicted, ms: NaN, aborted: true, predicted };
    } else {
      const t0 = performance.now();
      const r = naiveRecursive(a, b, naiveBudget);
      naive = { ops: r.ops, ms: performance.now() - t0, aborted: r.aborted, predicted };
      if (r.aborted) naiveDead = true;
    }

    post({ type: "progress", n, phase: "wf" });
    const wf = timeIt(() => wagnerFischerTwoRows(a, b));
    post({ type: "progress", n, phase: "uk" });
    const uk = timeIt(() => ukkonenBounded(a, b, k));

    post({
      type: "point",
      point: {
        n,
        naive,
        wf: { ops: wf.result.ops, ms: wf.ms },
        uk: { ops: uk.result.ops, ms: uk.ms, distance: uk.result.distance },
      },
    });
  }
  post({ type: "done" });
};
