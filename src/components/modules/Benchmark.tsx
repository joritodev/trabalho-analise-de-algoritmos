"use client";

import { useEffect, useRef, useState } from "react";
import { naiveRecursive } from "@/lib/levenshtein";
import type { BenchMessage, BenchPoint, BenchRequest, InputMode } from "@/workers/benchmark.worker";
import { LineChart, type Series } from "../LineChart";
import { Button, Card, LegendItem, Prose, Section, Segmented, Slider, SplitLayout, Stat, fmtCompact, fmtInt } from "../ui";

type Scale = "small" | "large";

const BUDGETS = [1e6, 1e7, 1e8, 4e8, 1e9];
const SMALL_NS = Array.from({ length: 16 }, (_, i) => i + 1);
const LARGE_NS = [50, 100, 200, 300, 400, 500, 750, 1000, 1250, 1500, 1750, 2000];
const GROWTH = 3 + 2 * Math.SQRT2; // (1+√2)², limite da razão T(n)/T(n−1)

const fmtMs = (ms: number) =>
  (!Number.isFinite(ms) ? "—" : ms < 0.01 ? `${(ms * 1000).toFixed(1)} µs` : ms < 1000 ? `${ms.toFixed(ms < 10 ? 2 : 0)} ms` : `${(ms / 1000).toFixed(2)} s`).replace(".", ",");

export function Benchmark() {
  const [scale, setScale] = useState<Scale>("small");
  const [mode, setMode] = useState<InputMode>("worst");
  const [k, setK] = useState(3);
  const [budgetIdx, setBudgetIdx] = useState(3);
  const [points, setPoints] = useState<BenchPoint[]>([]);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<{ n: number; phase: string; since: number } | null>(null);
  const [now, setNow] = useState(0);
  const [logY, setLogY] = useState(true);
  const [freezeMs, setFreezeMs] = useState<number | null>(null);
  const workerRef = useRef<Worker | null>(null);

  const stop = () => {
    workerRef.current?.terminate();
    workerRef.current = null;
    setRunning(false);
    setProgress(null);
  };

  const run = () => {
    stop();
    setPoints([]);
    const worker = new Worker(new URL("../../workers/benchmark.worker.ts", import.meta.url));
    workerRef.current = worker;
    worker.onmessage = (e: MessageEvent<BenchMessage>) => {
      const msg = e.data;
      if (msg.type === "progress") setProgress({ n: msg.n, phase: msg.phase, since: performance.now() });
      else if (msg.type === "point") setPoints((p) => [...p, msg.point]);
      else stop();
    };
    const req: BenchRequest = { ns: scale === "small" ? SMALL_NS : LARGE_NS, k, mode, naiveBudget: BUDGETS[budgetIdx] };
    worker.postMessage(req);
    setRunning(true);
  };

  useEffect(() => () => workerRef.current?.terminate(), []);

  // Relógio que prova que a UI continua fluida enquanto o worker trabalha.
  useEffect(() => {
    if (!running) return;
    let raf = 0;
    const tick = () => { setNow(performance.now()); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running]);

  const freezeMainThread = () => {
    // Executa de propósito na thread principal: a página fica bloqueada.
    setTimeout(() => {
      const t0 = performance.now();
      naiveRecursive("abcdefghijk", "bcdefghijkl", 1e9);
      setFreezeMs(performance.now() - t0);
    }, 50);
  };

  const measured = points.filter((p) => p.naive && !p.naive.aborted);
  const predicted = points.filter((p) => p.naive);
  const lastMeasured = measured.at(-1);
  const lastNaivePredicted = points.filter((p) => p.naive?.aborted)[0];

  const opsSeries: Series[] = [
    { id: "naive", label: "Recursão (medida)", color: "var(--color-s-naive)", points: measured.map((p) => ({ x: p.n, y: p.naive!.ops })) },
    {
      id: "naive-pred",
      label: "Recursão (prevista)",
      color: "var(--color-s-naive)",
      dashed: true,
      points: predicted.filter((p, i) => p.naive!.aborted || predicted[i + 1]?.naive?.aborted).map((p) => ({ x: p.n, y: p.naive!.predicted })),
    },
    { id: "wf", label: "Wagner-Fischer", color: "var(--color-s-wf)", points: points.map((p) => ({ x: p.n, y: p.wf.ops })) },
    { id: "uk", label: `Ukkonen (k=${k})`, color: "var(--color-s-uk)", points: points.map((p) => ({ x: p.n, y: Math.max(p.uk.ops, logY ? 1 : 0) })) },
  ];

  const growthSeries: Series[] = [
    {
      id: "growth",
      label: "T(n)/T(n−1)",
      color: "var(--color-s-naive)",
      points: predicted.slice(1).map((p, i) => ({ x: p.n, y: p.naive!.predicted / predicted[i].naive!.predicted })),
    },
  ];

  const normSeries: Series[] = [
    { id: "wf", label: "WF: ops / (m·n)", color: "var(--color-s-wf)", points: points.map((p) => ({ x: p.n, y: p.wf.ops / (p.n * p.n) })) },
    {
      id: "uk",
      label: "Ukkonen: ops / ((2k+1)·n)",
      color: "var(--color-s-uk)",
      points: points.map((p) => ({ x: p.n, y: p.uk.ops / ((2 * k + 1) * p.n) })),
    },
  ];

  const controls = (
    <>
      <Section title="Cenário">
        <Segmented<Scale>
          value={scale}
          onChange={(v) => { setScale(v); setLogY(v === "small"); }}
          options={[{ value: "small", label: "n = 1…16" }, { value: "large", label: "n = 50…2000" }]}
        />
        <Segmented<InputMode>
          value={mode}
          onChange={setMode}
          options={[{ value: "worst", label: "Pior caso (a = b)" }, { value: "random", label: "Aleatória" }]}
        />
        <Prose>
          <p>
            Recursão e Wagner-Fischer custam o mesmo para <b>qualquer</b> entrada de tamanho n. Para o Ukkonen, o pior caso são strings
            parecidas (nenhum corte antecipado). Com entradas aleatórias, ele desiste cedo.
          </p>
        </Prose>
      </Section>

      <Section title="Parâmetros">
        <Slider label="Limiar de erros do Ukkonen (k)" value={k} min={1} max={20} onChange={setK} />
        <Slider
          label="Orçamento da recursão"
          value={budgetIdx}
          min={0}
          max={BUDGETS.length - 1}
          onChange={setBudgetIdx}
          format={(i) => `${fmtCompact(BUDGETS[i])} chamadas`}
        />
        <p className="text-[11px] leading-relaxed text-ink-3">
          Acima do orçamento, a recursão é abortada e a curva continua tracejada com a contagem exata prevista pela recorrência.
        </p>
      </Section>

      <Section title="Execução">
        <div className="grid grid-cols-2 gap-2">
          <Button variant="primary" onClick={run} disabled={running}>▶ Executar</Button>
          <Button variant="danger" onClick={stop} disabled={!running}>■ Cancelar</Button>
        </div>
        {running && progress && (
          <div className="flex items-center gap-3 rounded-lg border border-line bg-surface-2 px-3 py-2 font-mono text-xs text-ink-2">
            <span className="size-3 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            <span>
              n = {progress.n} · {{ naive: "recursão", wf: "Wagner-Fischer", uk: "Ukkonen" }[progress.phase]} ·{" "}
              {((now - progress.since) / 1000).toFixed(1)} s
            </span>
          </div>
        )}
        {running && <p className="text-[11px] text-ink-3">O benchmark roda num Web Worker: a interface continua responsiva.</p>}
      </Section>

      <Section title="Sentir o travamento">
        <Prose>
          <p>Executa a recursão com n = 11 <b>na thread principal</b>. A página fica congelada até terminar (~6,8·10⁷ chamadas).</p>
        </Prose>
        <Button variant="danger" onClick={freezeMainThread}>Travar a página (n = 11)</Button>
        {freezeMs !== null && <p className="font-mono text-xs text-ink-2">Página bloqueada durante {fmtMs(freezeMs)}.</p>}
      </Section>
    </>
  );

  return (
    <SplitLayout
      controls={controls}
      stage={
        <>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <Stat
              label="Recursão: maior n concluído"
              value={lastMeasured ? `n = ${lastMeasured.n}` : "—"}
              sub={lastMeasured ? `${fmtCompact(lastMeasured.naive!.ops)} chamadas · ${fmtMs(lastMeasured.naive!.ms)}` : scale === "large" ? "inviável nesta escala" : "execute o teste"}
              tone="var(--color-s-naive)"
            />
            <Stat
              label="Recursão: próximo n"
              value={lastNaivePredicted ? fmtCompact(lastNaivePredicted.naive!.predicted) : "—"}
              sub={lastNaivePredicted ? `chamadas previstas para n = ${lastNaivePredicted.n}` : "abortada acima do orçamento"}
            />
            <Stat
              label={`Wagner-Fischer em n = ${points.at(-1)?.n ?? "…"}`}
              value={points.length ? fmtMs(points.at(-1)!.wf.ms) : "—"}
              sub={points.length ? `${fmtInt(points.at(-1)!.wf.ops)} células` : "Θ(n²)"}
              tone="var(--color-s-wf)"
            />
            <Stat
              label={`Ukkonen em n = ${points.at(-1)?.n ?? "…"}`}
              value={points.length ? fmtMs(points.at(-1)!.uk.ms) : "—"}
              sub={points.length ? `${fmtInt(points.at(-1)!.uk.ops)} células` : "Θ(k·n)"}
              tone="var(--color-s-uk)"
            />
          </div>

          <Card
            title="Número de operações × tamanho da palavra (n)"
            right={<Segmented<"log" | "lin"> value={logY ? "log" : "lin"} onChange={(v) => setLogY(v === "log")} options={[{ value: "log", label: "log" }, { value: "lin", label: "linear" }]} />}
          >
            <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1.5">
              {opsSeries.filter((s) => s.points.length).map((s) => (
                <LegendItem key={s.id} color={s.color} label={s.label} swatch={s.dashed ? "dash" : "line"} />
              ))}
            </div>
            {points.length ? (
              <LineChart series={opsSeries} logY={logY} xLabel="n (letras)" yLabel="operações" formatY={(v) => fmtCompact(v).replace(/^1,00·/, "")} height={320} />
            ) : (
              <Empty running={running} />
            )}
          </Card>

          <div className="grid gap-5 xl:grid-cols-2">
            <Card title="Recursão: razão de crescimento T(n)/T(n−1)">
              {predicted.length > 1 ? (
                <LineChart
                  series={growthSeries}
                  xLabel="n"
                  yLabel="razão"
                  formatY={(v) => v.toFixed(1)}
                  yDomain={[3, 9.5]}
                  refLines={[{ y: 9, label: "limite sup. 9 = 3²" }, { y: GROWTH, label: "(1+√2)² ≈ 5,83" }, { y: 4, label: "limite inf. 4" }]}
                  height={240}
                />
              ) : (
                <Empty running={running} text={scale === "large" ? "Disponível na escala n = 1…16." : undefined} />
              )}
              <p className="mt-2 text-[11px] leading-relaxed text-ink-3">
                Fica presa entre 4 e 9 e converge para 5,83: o custo é exponencial em n, como diz a prova.
              </p>
            </Card>
            <Card title="Normalização pelo limite teórico do pior caso">
              <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1.5">
                {normSeries.map((s) => <LegendItem key={s.id} color={s.color} label={s.label} swatch="line" />)}
              </div>
              {points.length ? (
                <LineChart series={normSeries} xLabel="n" yLabel="ops / limite" formatY={(v) => v.toFixed(2)} yDomain={[0, 1.2]} height={212} />
              ) : (
                <Empty running={running} />
              )}
              <p className="mt-2 text-[11px] leading-relaxed text-ink-3">
                Curva plana = custo proporcional ao limite. No pior caso, as duas convergem para 1.
              </p>
            </Card>
          </div>

          {points.length > 0 && (
            <Card title="Tabela de medições">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] font-mono text-xs tabular-nums">
                  <thead>
                    <tr className="border-b border-line text-left text-ink-3">
                      <th className="py-2 pr-3 font-normal">n</th>
                      <th className="py-2 pr-3 font-normal">recursão: chamadas</th>
                      <th className="py-2 pr-3 font-normal">tempo</th>
                      <th className="py-2 pr-3 font-normal">WF: células</th>
                      <th className="py-2 pr-3 font-normal">tempo</th>
                      <th className="py-2 pr-3 font-normal">Ukkonen: células</th>
                      <th className="py-2 pr-3 font-normal">tempo</th>
                      <th className="py-2 font-normal">dist ≤ k?</th>
                    </tr>
                  </thead>
                  <tbody>
                    {points.map((p) => (
                      <tr key={p.n} className="border-b border-line/60 text-ink-2">
                        <td className="py-1.5 pr-3 text-ink">{p.n}</td>
                        <td className="py-1.5 pr-3">{p.naive ? `${fmtCompact(p.naive.ops)}${p.naive.aborted ? " (prev.)" : ""}` : "—"}</td>
                        <td className="py-1.5 pr-3">{p.naive?.aborted ? <span className="text-dup">abortada</span> : fmtMs(p.naive?.ms ?? NaN)}</td>
                        <td className="py-1.5 pr-3">{fmtInt(p.wf.ops)}</td>
                        <td className="py-1.5 pr-3">{fmtMs(p.wf.ms)}</td>
                        <td className="py-1.5 pr-3">{fmtInt(p.uk.ops)}</td>
                        <td className="py-1.5 pr-3">{fmtMs(p.uk.ms)}</td>
                        <td className="py-1.5">{p.uk.distance === null ? "não (corte)" : `sim (${p.uk.distance})`}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      }
    />
  );
}

function Empty({ running, text }: { running: boolean; text?: string }) {
  return (
    <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-line text-sm text-ink-3">
      {text ?? (running ? "Medindo…" : "Clique em ▶ Executar para iniciar o stress test.")}
    </div>
  );
}
