"use client";

import { useMemo, useState } from "react";
import { ukkonenTrace, wagnerFischerTrace } from "@/lib/levenshtein";
import { Button, Card, Formula, LegendItem, Prose, Section, Slider, SplitLayout, Stat, TextField, fmtInt } from "../ui";

const PRESETS = [
  { label: "Aceito (dist ≤ k)", a: "levenshtein", b: "lowenstein", k: 3 },
  { label: "Pior caso (a = b)", a: "algoritmo", b: "algoritmo", k: 2 },
  { label: "Corte antecipado", a: "programacao", b: "dinamicaxyz", k: 2 },
  { label: "Ω(1): | |a|−|b| | > k", a: "complexidade", b: "casa", k: 3 },
];

export function UkkonenCut() {
  const [a, setA] = useState(PRESETS[0].a);
  const [b, setB] = useState(PRESETS[0].b);
  const [k, setK] = useState(PRESETS[0].k);
  const [showHidden, setShowHidden] = useState(false);

  const maxK = Math.max(a.length, b.length, 1);
  const kk = Math.min(k, maxK);
  const trace = useMemo(() => ukkonenTrace(a, b, kk), [a, b, kk]);
  const full = useMemo(() => wagnerFischerTrace(a, b), [a, b]);

  const totalInner = a.length * b.length;
  const saved = totalInner ? (1 - trace.ops / totalInner) * 100 : 0;
  const cols = b.length + 1;
  const size = cols > 14 ? 30 : cols > 10 ? 36 : 42;
  const head = size * 0.8;

  const verdict =
    trace.cutReason === "length-gap"
      ? { text: "Rejeitado", sub: `O(1): |${a.length} − ${b.length}| = ${Math.abs(a.length - b.length)} > k`, tone: "var(--color-dup)" }
      : trace.cutReason === "row-min"
        ? { text: "Rejeitado", sub: trace.cutRow !== null ? `dist > k · corte na linha ${trace.cutRow}/${a.length}` : "D[m][n] > k", tone: "var(--color-dup)" }
        : { text: `Aceito: ${trace.distance}`, sub: `distância real = ${full.distance}`, tone: "var(--color-op-match)" };

  const controls = (
    <>
      <Section title="Entrada">
        <TextField label="Palavra a" value={a} onChange={setA} maxLength={16} />
        <TextField label="Palavra b" value={b} onChange={setB} maxLength={16} />
      </Section>
      <Section title="Limiar de erros">
        <Slider label="k (máximo de erros tolerados)" value={kk} min={0} max={maxK} onChange={setK} />
        <p className="font-mono text-[11px] text-ink-3">faixa calculada: |i − j| ≤ {kk} · largura ≤ {2 * kk + 1}</p>
      </Section>
      <Section title="Cenários prontos">
        <div className="grid grid-cols-2 gap-2">
          {PRESETS.map((p) => (
            <Button key={p.label} className="text-xs" onClick={() => { setA(p.a); setB(p.b); setK(p.k); }}>
              {p.label}
            </Button>
          ))}
        </div>
      </Section>
      <Section title="Exibição">
        <label className="flex cursor-pointer items-center gap-2 text-xs text-ink-2">
          <input type="checkbox" checked={showHidden} onChange={(e) => setShowHidden(e.target.checked)} className="accent-accent" />
          Mostrar valores reais nas células cortadas
        </label>
        <p className="text-[11px] leading-relaxed text-ink-3">Prova visual do lema: toda célula fora da faixa tem valor ≥ |i − j| &gt; k.</p>
      </Section>
      <Section title="Legenda">
        <div className="flex flex-col gap-2">
          <LegendItem color="var(--color-op-match)" label="Calculada, valor ≤ k" />
          <LegendItem color="var(--color-op-sub)" label="Calculada, valor > k (∞)" />
          <LegendItem color="var(--color-ink-3)" label="Fora da faixa: nunca calculada" />
          <LegendItem color="var(--color-dup)" label="Abandonada após o corte antecipado" />
        </div>
      </Section>
    </>
  );

  return (
    <SplitLayout
      controls={controls}
      stage={
        <>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <Stat label="Células calculadas" value={`${fmtInt(trace.ops)} / ${fmtInt(totalInner)}`} sub="Ukkonen / Wagner-Fischer" tone="var(--color-s-uk)" />
            <Stat label="Trabalho evitado" value={`${saved.toFixed(1).replace(".", ",")}%`} sub="das células internas" />
            <Stat label="Limite do pior caso" value={fmtInt((2 * kk + 1) * Math.min(a.length, b.length || 1))} sub="(2k+1)·min(m,n)" />
            <Stat label="Veredito" value={verdict.text} sub={verdict.sub} tone={verdict.tone} />
          </div>

          <Card title="Máscara diagonal sobre a matriz" right={<span className="font-mono text-[11px] text-ink-3">k = {kk}</span>}>
            <div className="overflow-auto">
              <div className="relative mx-auto" style={{ width: head + cols * size, height: head + (a.length + 1) * size }}>
                {["ε", ...b].map((ch, j) => (
                  <div key={`h${j}`} className="absolute flex items-center justify-center font-mono text-xs text-ink-3" style={{ left: head + j * size, top: 0, width: size, height: head }}>{ch}</div>
                ))}
                {["ε", ...a].map((ch, i) => (
                  <div key={`r${i}`} className="absolute flex items-center justify-center font-mono text-xs text-ink-3" style={{ left: 0, top: head + i * size, width: head, height: size }}>{ch}</div>
                ))}
                {trace.cells.map((row, i) =>
                  row.map((cell, j) => {
                    let bg = "var(--color-surface-2)";
                    let text: string | number = "";
                    let color = "var(--color-ink)";
                    let cls = "";
                    if (cell.kind === "computed") {
                      const over = cell.value > kk;
                      bg = `color-mix(in oklab, ${over ? "var(--color-op-sub)" : "var(--color-op-match)"} ${over ? 22 : 20}%, var(--color-surface-2))`;
                      text = over ? "∞" : cell.value;
                    } else if (cell.kind === "skipped") {
                      cls = "hatch";
                      bg = "var(--color-surface)";
                      text = showHidden ? full.matrix[i][j] : "";
                      color = "var(--color-ink-3)";
                    } else {
                      bg = "color-mix(in oklab, var(--color-dup) 10%, var(--color-surface))";
                      text = showHidden ? full.matrix[i][j] : "×";
                      color = "var(--color-dup)";
                    }
                    const isGoal = i === a.length && j === b.length;
                    return (
                      <div key={`${i},${j}`} className="absolute p-[2px]" style={{ left: head + j * size, top: head + i * size, width: size, height: size }}>
                        <div
                          className={`flex size-full items-center justify-center rounded-md font-mono text-[12px] tabular-nums transition-colors duration-300 ${cls}`}
                          style={{ background: bg, color, boxShadow: isGoal ? "0 0 0 1.5px var(--color-ink)" : "inset 0 0 0 1px var(--color-line)" }}
                        >
                          {text}
                        </div>
                      </div>
                    );
                  }),
                )}
                {trace.cutRow !== null && trace.cutReason === "row-min" && (
                  <div
                    className="pointer-events-none absolute border-t-2 border-dashed border-dup"
                    style={{ left: head, top: head + (trace.cutRow + 1) * size, width: cols * size }}
                  >
                    <span className="absolute -top-5 right-0 font-mono text-[10px] text-dup">mín(linha {trace.cutRow}) &gt; k → para</span>
                  </div>
                )}
              </div>
            </div>
          </Card>

          <div className="grid gap-5 xl:grid-cols-2">
            <Card title="Por que a faixa é suficiente (lema)">
              <Prose>
                <p>
                  Transformar um prefixo de tamanho <b>i</b> num de tamanho <b>j</b> exige pelo menos <b>|i − j|</b> inserções ou deleções. Logo,{" "}
                  <b>D[i][j] ≥ |i − j|</b>.
                </p>
                <p>
                  Todo caminho até D[m][n] que passe por uma célula com |i − j| &gt; k já custa mais de k. Essas células podem ser tratadas como ∞ sem mudar a
                  resposta quando ela é ≤ k.
                </p>
              </Prose>
            </Card>
            <Card title="Custo no pior caso">
              <Formula>
                células por linha ≤ 2k + 1<br />
                T(m,n) ≤ m·(2k+1), com m ≤ n + k<br />
                ⇒ T = O(k · min(m, n))<br />
                pior caso (a = b): T = (2k+1)·n − k(k+1) = Θ(k·n)<br />
                melhor caso: ||a| − |b|| &gt; k ⇒ Ω(1)
              </Formula>
            </Card>
          </div>
        </>
      }
    />
  );
}
