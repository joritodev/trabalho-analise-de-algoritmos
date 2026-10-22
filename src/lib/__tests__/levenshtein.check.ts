import { naiveRecursive, naiveCallCount, wagnerFischerTrace, wagnerFischerTwoRows,
  ukkonenBounded, buildRecursionTree, memoryReport } from "../levenshtein.ts";

const rnd = (len: number) => Array.from({ length: len }, () => "abc"[Math.floor(Math.random() * 3)]).join("");
let fails = 0;
for (let t = 0; t < 3000; t++) {
  const a = rnd(Math.floor(Math.random() * 8)), b = rnd(Math.floor(Math.random() * 8));
  const nv = naiveRecursive(a, b), wf = wagnerFischerTrace(a, b), tr = wagnerFischerTwoRows(a, b);
  if (nv.ops !== naiveCallCount(a.length, b.length)) fails++;
  if (nv.distance !== wf.distance || wf.distance !== tr.distance) fails++;
  // O caminho de backtracking tem de custar exatamente a distância.
  if (wf.path.filter(s => s.op !== "match" && s.op !== "init").length !== wf.distance) fails++;
  for (let k = 0; k <= 8; k++) {
    const u = ukkonenBounded(a, b, k);
    if ((wf.distance <= k ? wf.distance : null) !== u.distance) fails++;
  }
}
// Strings longas com alfabeto binário: muitos casos com distância ≈ k.
for (let t = 0; t < 2000; t++) {
  const r = (n: number) => Array.from({ length: n }, () => "ab"[Math.floor(Math.random() * 2)]).join("");
  const a = r(Math.floor(Math.random() * 30)), b = r(Math.floor(Math.random() * 30));
  const d = wagnerFischerTrace(a, b).distance;
  for (let k = 0; k <= 12; k++) if (ukkonenBounded(a, b, k).distance !== (d <= k ? d : null)) fails++;
}
// Pior caso do Ukkonen (a = b): contagem exata (2k+1)n − k(k+1) sempre que n ≥ k.
for (let n = 1; n <= 60; n++) for (let k = 0; k <= n; k++) {
  const a = "x".repeat(n);
  if (ukkonenBounded(a, a, k).ops !== (2 * k + 1) * n - k * (k + 1)) fails++;
}
console.log("falhas:", fails);
console.log("kitten→sitting:", wagnerFischerTrace("kitten", "sitting").distance);
console.log("\n n | T(n,n) chamadas | razão T(n)/T(n-1) | 3^n");
for (let n = 1; n <= 14; n++)
  console.log(String(n).padStart(2), "|", naiveCallCount(n, n).toExponential(3).padStart(10), "|",
    (naiveCallCount(n, n) / naiveCallCount(n - 1, n - 1)).toFixed(3), "|", (3 ** n).toExponential(2));
console.log("1+√2)^2 =", ((1 + Math.SQRT2) ** 2).toFixed(4));
const tree = buildRecursionTree("gato", "pato", 1000);
console.log("\nárvore gato/pato:", tree.length, "nós,", tree.filter(x => x.duplicate).length, "duplicados");
console.log("memória n=1000:", memoryReport(1000, 1000));
