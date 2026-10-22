"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { wagnerFischerTrace, type CellStep, type Op } from "@/lib/levenshtein";
import { Button, Card, Formula, LegendItem, Prose, Section, Slider, SplitLayout, Stat, TextField, fmtInt } from "../ui";

export const OP_COLOR: Record<Op, string> = {
  init: "var(--color-ink-3)",
  match: "var(--color-op-match)",
  sub: "var(--color-op-sub)",
  ins: "var(--color-op-ins)",
  del: "var(--color-op-del)",
};

export const OP_LABEL: Record<Op, string> = {
  init: "Caso base",
  match: "Match (custo 0)",
  sub: "Substituição",
  ins: "Inserção",
  del: "Deleção",
};

export function MatrixSimulator() {
  const [source, setSource] = useState("algoritmo");
  const [target, setTarget] = useState("logaritmo");
  const [speed, setSpeed] = useState(8);
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);

  const trace = useMemo(() => wagnerFischerTrace(source, target), [source, target]);
  const fillSteps = trace.steps.length;
  const total = fillSteps + trace.path.length;

  // Reinicia a animação sempre que as palavras mudam.
  useEffect(() => {
    setT(0);
    setPlaying(false);
  }, [source, target]);

  useEffect(() => {
    if (!playing) return;
    if (t >= total) {
      setPlaying(false);
      return;
    }
    const id = setTimeout(() => setT((x) => Math.min(total, x + 1)), 1000 / speed);
    return () => clearTimeout(id);
  }, [playing, t, total, speed]);

  const stepFwd = useCallback(() => setT((x) => Math.min(total, x + 1)), [total]);
  const stepBack = useCallback(() => setT((x) => Math.max(0, x - 1)), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "INPUT") return;
      if (e.key === " ") {
        e.preventDefault();
        if (t >= total) {
          setT(0);
          setPlaying(true);
        } else setPlaying((p) => !p);
      } else if (e.key === "ArrowRight") stepFwd();
      else if (e.key === "ArrowLeft") stepBack();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stepFwd, stepBack, t, total]);

  const filled = Math.min(t, fillSteps);
  const current: CellStep | null = t > 0 && t <= fillSteps ? trace.steps[t - 1] : null;
  const pathShown = Math.max(0, t - fillSteps);
  const done = t >= total;

  const controls = (
    <>
      <Section title="Entrada">
        <TextField label="Palavra de origem (a)" value={source} onChange={setSource} />
        <TextField label="Palavra de destino (b)" value={target} onChange={setTarget} />
      </Section>

      <Section title="Reprodução" hint={`${t}/${total}`}>
        <div className="grid grid-cols-4 gap-2">
          <Button onClick={() => { setT(0); setPlaying(false); }} title="Reiniciar">⏮</Button>
          <Button onClick={stepBack} disabled={t === 0} title="Retroceder um passo">◀</Button>
          <Button
            variant="primary"
            onClick={() => (done ? (setT(0), setPlaying(true)) : setPlaying((p) => !p))}
            title={playing ? "Pausar" : "Reproduzir"}
          >
            {playing ? "❚❚" : "▶"}
          </Button>
          <Button onClick={stepFwd} disabled={done} title="Avançar um passo">▶︎|</Button>
        </div>
        <input
          type="range"
          min={0}
          max={total}
          value={t}
          onChange={(e) => { setPlaying(false); setT(Number(e.target.value)); }}
          aria-label="Linha do tempo"
          className="w-full"
        />
        <Slider label="Velocidade" value={speed} min={1} max={40} onChange={setSpeed} format={(v) => `${v} células/s`} />
        <Button onClick={() => { setPlaying(false); setT(total); }} disabled={done}>
          Saltar para o resultado
        </Button>
        <p className="font-mono text-[11px] text-ink-3">Atalhos: espaço = play/pause · ← → = passo</p>
      </Section>

      <Section title="Recorrência">
        <Formula>
          D[i][0] = i, D[0][j] = j<br />
          D[i][j] = min(<br />
          &nbsp;&nbsp;D[i−1][j] + 1, <span className="text-op-del">// deleção</span><br />
          &nbsp;&nbsp;D[i][j−1] + 1, <span className="text-op-ins">// inserção</span><br />
          &nbsp;&nbsp;D[i−1][j−1] + [aᵢ ≠ bⱼ] <span className="text-op-sub">// diagonal</span><br />
          )
        </Formula>
      </Section>

      <Section title="Legenda">
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {(["match", "sub", "ins", "del", "init"] as Op[]).map((op) => (
            <LegendItem key={op} color={OP_COLOR[op]} label={OP_LABEL[op]} />
          ))}
          <LegendItem color="var(--color-ink)" label="Caminho ótimo" swatch="line" />
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
            <Stat label="Células preenchidas" value={`${fmtInt(filled)} / ${fmtInt(fillSteps)}`} sub="(m+1)·(n+1)" />
            <Stat label="Operações internas" value={fmtInt(source.length * target.length)} sub={`m·n = ${source.length}·${target.length}`} />
            <Stat
              label="Distância"
              value={filled === fillSteps ? trace.distance : "…"}
              sub={filled === fillSteps ? `D[${source.length}][${target.length}]` : "calculando"}
              tone={filled === fillSteps ? "var(--color-accent)" : undefined}
            />
            <Stat label="Complexidade" value="Θ(m·n)" sub="tempo · qualquer entrada" />
          </div>

          <Card title="Matriz de programação dinâmica" right={<span className="font-mono text-[11px] text-ink-3">{done ? "backtracking concluído" : pathShown > 0 ? "desenhando caminho…" : current ? `célula (${current.i}, ${current.j})` : "pronto"}</span>}>
            <MatrixGrid a={source} b={target} matrix={trace.matrix} steps={trace.steps} filled={filled} current={current} path={trace.path.slice(0, pathShown)} />
          </Card>

          <div className="grid gap-5 xl:grid-cols-2">
            <Card title="Cálculo da célula atual">
              {current ? <CellExplanation a={source} b={target} m={trace.matrix} step={current} /> : (
                <Prose>
                  <p>
                    {done || pathShown > 0
                      ? "A matriz está completa. O backtracking parte de D[m][n] e volta até D[0][0], escolhendo sempre uma célula vizinha que explique o valor atual."
                      : "Clique em ▶ para preencher a matriz linha a linha. Cada célula depende só de três vizinhas já calculadas: em cima, à esquerda e na diagonal."}
                  </p>
                </Prose>
              )}
            </Card>
            <Card title="Alinhamento resultante">
              {done ? <Alignment a={source} b={target} path={trace.path} /> : (
                <Prose><p>O alinhamento aparece quando o caminho ótimo estiver completo.</p></Prose>
              )}
            </Card>
          </div>
        </>
      }
    />
  );
}

function MatrixGrid({ a, b, matrix, steps, filled, current, path }: {
  a: string;
  b: string;
  matrix: number[][];
  steps: CellStep[];
  filled: number;
  current: CellStep | null;
  path: CellStep[];
}) {
  const cols = b.length + 1;
  const size = cols > 14 ? 30 : cols > 10 ? 36 : 44;
  const head = size * 0.8;

  const stepAt = useMemo(() => {
    const m = new Map<string, { idx: number; step: CellStep }>();
    steps.forEach((s, idx) => m.set(`${s.i},${s.j}`, { idx, step: s }));
    return m;
  }, [steps]);
  const onPath = useMemo(() => new Set(path.map((p) => `${p.i},${p.j}`)), [path]);
  const deps = current && current.i > 0 && current.j > 0
    ? { diag: `${current.i - 1},${current.j - 1}`, up: `${current.i - 1},${current.j}`, left: `${current.i},${current.j - 1}` }
    : null;
  const chosenDep = current && deps ? (current.op === "match" || current.op === "sub" ? deps.diag : current.op === "del" ? deps.up : deps.left) : null;

  const center = (i: number, j: number) => ({ x: head + j * size + size / 2, y: head + i * size + size / 2 });

  return (
    <div className="overflow-auto">
      <div className="relative mx-auto" style={{ width: head + cols * size, height: head + (a.length + 1) * size }}>
        {/* Cabeçalho: caracteres de b */}
        {["ε", ...b].map((ch, j) => (
          <div key={`h${j}`} className="absolute flex items-center justify-center font-mono text-xs text-ink-3" style={{ left: head + j * size, top: 0, width: size, height: head }}>
            <span className={current?.j === j ? "text-ink" : ""}>{ch}</span>
          </div>
        ))}
        {["ε", ...a].map((ch, i) => (
          <div key={`r${i}`} className="absolute flex items-center justify-center font-mono text-xs text-ink-3" style={{ left: 0, top: head + i * size, width: head, height: size }}>
            <span className={current?.i === i ? "text-ink" : ""}>{ch}</span>
          </div>
        ))}

        {path.length > 1 && (
          <svg className="pointer-events-none absolute inset-0" width="100%" height="100%">
            <polyline
              points={path.map((p) => { const c = center(p.i, p.j); return `${c.x},${c.y}`; }).join(" ")}
              fill="none"
              stroke="var(--color-ink)"
              strokeOpacity={0.9}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
        {matrix.map((row, i) =>
          row.map((v, j) => {
            const key = `${i},${j}`;
            const info = stepAt.get(key)!;
            const isFilled = info.idx < filled;
            const isCurrent = current?.i === i && current?.j === j;
            const color = OP_COLOR[info.step.op];
            const isDep = deps && (key === deps.diag || key === deps.up || key === deps.left);
            const inPath = onPath.has(key);
            return (
              <div
                key={key}
                className="absolute p-[2px]"
                style={{ left: head + j * size, top: head + i * size, width: size, height: size }}
              >
                <div
                  className={`flex size-full items-center justify-center rounded-md font-mono text-[13px] tabular-nums transition-[background,box-shadow,color] duration-200 ${isFilled ? "animate-cell-in" : ""}`}
                  style={{
                    background: isFilled
                      ? `color-mix(in oklab, ${color} ${inPath ? 55 : isCurrent ? 45 : 16}%, var(--color-surface-2))`
                      : "var(--color-surface-2)",
                    color: isFilled ? "var(--color-ink)" : "transparent",
                    boxShadow: isCurrent
                      ? `0 0 0 2px ${color}`
                      : inPath
                        ? "0 0 0 1.5px var(--color-ink)"
                        : isDep
                          ? `inset 0 0 0 1.5px ${key === chosenDep ? OP_COLOR[current!.op] : "var(--color-line-strong)"}`
                          : "inset 0 0 0 1px var(--color-line)",
                  }}
                >
                  {v}
                </div>
              </div>
            );
          }),
        )}

      </div>
    </div>
  );
}

function CellExplanation({ a, b, m, step }: { a: string; b: string; m: number[][]; step: CellStep }) {
  const { i, j } = step;
  if (i === 0 || j === 0) {
    return (
      <Prose>
        <p>
          <b>Caso base</b>: D[{i}][{j}] = {step.value}. Transformar {i === 0 ? "a palavra vazia" : `"${a.slice(0, i)}"`} em{" "}
          {j === 0 ? "a palavra vazia" : `"${b.slice(0, j)}"`} exige exatamente {step.value} {i === 0 ? "inserções" : "deleções"}.
        </p>
      </Prose>
    );
  }
  const same = a[i - 1] === b[j - 1];
  const options: { op: Op; label: string; expr: string; v: number }[] = [
    { op: "del", label: "deleção", expr: `D[${i - 1}][${j}] + 1`, v: m[i - 1][j] + 1 },
    { op: "ins", label: "inserção", expr: `D[${i}][${j - 1}] + 1`, v: m[i][j - 1] + 1 },
    { op: same ? "match" : "sub", label: same ? "match" : "substituição", expr: `D[${i - 1}][${j - 1}] + ${same ? 0 : 1}`, v: m[i - 1][j - 1] + (same ? 0 : 1) },
  ];
  return (
    <div className="flex flex-col gap-3 animate-fade-up" key={`${i},${j}`}>
      <Prose>
        <p>
          Comparando <b className="font-mono">a[{i}] = &apos;{a[i - 1]}&apos;</b> com <b className="font-mono">b[{j}] = &apos;{b[j - 1]}&apos;</b>:{" "}
          {same ? "os caracteres são iguais, por isso a diagonal custa 0." : "os caracteres diferem, por isso a diagonal custa 1."}
        </p>
      </Prose>
      <div className="flex flex-col gap-1.5">
        {options.map((o) => {
          const chosen = o.op === step.op;
          return (
            <div
              key={o.label}
              className="flex items-center justify-between rounded-lg border px-3 py-2 font-mono text-xs"
              style={{
                borderColor: chosen ? OP_COLOR[o.op] : "var(--color-line)",
                background: chosen ? `color-mix(in oklab, ${OP_COLOR[o.op]} 14%, transparent)` : "transparent",
              }}
            >
              <span className="flex items-center gap-2 text-ink-2">
                <span className="size-2 rounded-full" style={{ background: OP_COLOR[o.op] }} />
                {o.expr}
                <span className="text-ink-3">· {o.label}</span>
              </span>
              <span className={chosen ? "font-semibold text-ink" : "text-ink-3"}>{o.v}</span>
            </div>
          );
        })}
      </div>
      <div className="font-mono text-sm text-ink">
        D[{i}][{j}] = min({options.map((o) => o.v).join(", ")}) = <span className="text-accent">{step.value}</span>
      </div>
    </div>
  );
}

function Alignment({ a, b, path }: { a: string; b: string; path: CellStep[] }) {
  const cols = path.slice(1).map((s) => {
    if (s.op === "match" || s.op === "sub") return { top: a[s.i - 1], bot: b[s.j - 1], op: s.op };
    if (s.op === "del") return { top: a[s.i - 1], bot: "—", op: s.op };
    return { top: "—", bot: b[s.j - 1], op: s.op };
  });
  const counts = cols.reduce<Record<string, number>>((acc, c) => ((acc[c.op] = (acc[c.op] ?? 0) + 1), acc), {});
  return (
    <div className="flex flex-col gap-4 animate-fade-up">
      <div className="overflow-x-auto">
        <div className="inline-grid gap-y-1 font-mono text-sm" style={{ gridTemplateColumns: `repeat(${cols.length}, 1.75rem)` }}>
          {cols.map((c, k) => <div key={`t${k}`} className="text-center text-ink">{c.top}</div>)}
          {cols.map((c, k) => (
            <div key={`m${k}`} className="flex justify-center">
              <span className="h-1.5 w-5 rounded-full" style={{ background: OP_COLOR[c.op], opacity: c.op === "match" ? 0.45 : 1 }} />
            </div>
          ))}
          {cols.map((c, k) => <div key={`b${k}`} className="text-center text-ink">{c.bot}</div>)}
        </div>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-ink-2">
        {(["match", "sub", "ins", "del"] as Op[]).map((op) => (
          <span key={op} className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ background: OP_COLOR[op] }} />
            {OP_LABEL[op].split(" ")[0]}: {counts[op] ?? 0}
          </span>
        ))}
      </div>
    </div>
  );
}
