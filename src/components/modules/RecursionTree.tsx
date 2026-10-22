"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { buildRecursionTree, naiveCallCount, type TreeNode } from "@/lib/levenshtein";
import { Button, Card, LegendItem, Prose, Section, Segmented, Slider, SplitLayout, Stat, TextField, fmtInt } from "../ui";

type Label = "ij" | "prefix";

const NODE_W = 46;
const NODE_H = 26;
const GAP_X = 8;
const LEVEL_H = 64;

interface Placed extends TreeNode {
  x: number;
  y: number;
}

/** Layout "tidy" simples: folhas em sequência, cada pai centrado sobre os filhos. */
function layout(nodes: TreeNode[]): { placed: Placed[]; width: number; height: number } {
  const placed = nodes.map((n) => ({ ...n, x: 0, y: n.depth * LEVEL_H + NODE_H })) as Placed[];
  let cursor = NODE_W / 2 + 4;
  const visit = (id: number) => {
    const node = placed[id];
    if (!node.children.length) {
      node.x = cursor;
      cursor += NODE_W + GAP_X;
      return;
    }
    node.children.forEach(visit);
    node.x = (placed[node.children[0]].x + placed[node.children.at(-1)!].x) / 2;
  };
  if (placed.length) visit(0);
  const maxDepth = Math.max(0, ...placed.map((p) => p.depth));
  return { placed, width: cursor, height: maxDepth * LEVEL_H + NODE_H * 2 + 8 };
}

export function RecursionTree() {
  const [a, setA] = useState("sol");
  const [b, setB] = useState("sal");
  const [maxNodes, setMaxNodes] = useState(600);
  const [label, setLabel] = useState<Label>("ij");
  const [hover, setHover] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  const nodes = useMemo(() => buildRecursionTree(a, b, maxNodes), [a, b, maxNodes]);
  const { placed, width, height } = useMemo(() => layout(nodes), [nodes]);

  const totalCalls = naiveCallCount(a.length, b.length);
  const unique = (a.length + 1) * (b.length + 1);
  const dupCount = nodes.filter((n) => n.duplicate).length;
  const truncated = totalCalls > nodes.length;

  const occurrences = useMemo(() => {
    const m = new Map<string, number>();
    nodes.forEach((n) => m.set(`${n.i},${n.j}`, (m.get(`${n.i},${n.j}`) ?? 0) + 1));
    return m;
  }, [nodes]);
  const topRepeated = [...occurrences.entries()].sort((x, y) => y[1] - x[1]).slice(0, 6);

  const nodeText = (n: TreeNode) =>
    label === "ij" ? `${n.i},${n.j}` : `${a.slice(0, n.i) || "ε"}|${b.slice(0, n.j) || "ε"}`;
  const w = label === "ij" ? NODE_W : Math.max(NODE_W, (Math.max(a.length, 1) + Math.max(b.length, 1) + 1) * 7 + 10);
  const scaleX = w / NODE_W;

  // Centra a raiz na área visível sempre que a árvore muda.
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scroller.current;
    if (el && placed.length) el.scrollLeft = placed[0].x * scaleX * zoom - el.clientWidth / 2;
  }, [placed, scaleX, zoom]);

  const controls = (
    <>
      <Section title="Entrada (palavras curtas)">
        <TextField label="Palavra a" value={a} onChange={setA} maxLength={6} />
        <TextField label="Palavra b" value={b} onChange={setB} maxLength={6} />
      </Section>
      <Section title="Visualização">
        <Slider label="Máximo de nós desenhados" value={maxNodes} min={50} max={2500} step={50} onChange={setMaxNodes} format={fmtInt} />
        <Slider label="Zoom" value={zoom} min={0.3} max={1.5} step={0.05} onChange={setZoom} format={(v) => `${Math.round(v * 100)}%`} />
        <Button
          onClick={() => {
            const el = scroller.current;
            if (el) setZoom(Math.max(0.3, Math.min(1.5, el.clientWidth / (width * scaleX))));
          }}
        >
          Ajustar à largura
        </Button>
        <Segmented<Label> value={label} onChange={setLabel} options={[{ value: "ij", label: "lev(i, j)" }, { value: "prefix", label: "prefixos" }]} />
      </Section>
      <Section title="Legenda">
        <div className="flex flex-col gap-2">
          <LegendItem color="var(--color-accent)" label="1ª vez que o subproblema aparece" />
          <LegendItem color="var(--color-dup)" label="Subproblema repetido (recomputação)" />
          <LegendItem color="var(--color-ink-3)" label="Caso base (i = 0 ou j = 0)" />
        </div>
      </Section>
      <Section title="Por que explode">
        <Prose>
          <p>
            Cada chamada lev(i, j) gera três: <b>(i−1, j)</b>, <b>(i, j−1)</b> e <b>(i−1, j−1)</b>. Só existem (m+1)(n+1) subproblemas
            diferentes, mas a árvore os resolve de novo sempre que reaparecem.
          </p>
          <p>Passe o mouse sobre um nó para destacar todas as cópias do mesmo subproblema.</p>
        </Prose>
      </Section>
    </>
  );

  return (
    <SplitLayout
      controls={controls}
      stage={
        <>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <Stat label="Chamadas totais T(m,n)" value={fmtInt(totalCalls)} sub="pela recorrência" tone="var(--color-s-naive)" />
            <Stat label="Subproblemas distintos" value={fmtInt(unique)} sub="(m+1)·(n+1) = custo da PD" tone="var(--color-accent)" />
            <Stat label="Desperdício" value={`${((1 - unique / totalCalls) * 100).toFixed(1).replace(".", ",")}%`} sub="chamadas redundantes" tone="var(--color-dup)" />
            <Stat label="Nós desenhados" value={fmtInt(nodes.length)} sub={`${fmtInt(dupCount)} repetidos${truncated ? " · truncado" : ""}`} />
          </div>

          <Card
            title={`Árvore de chamadas de lev("${a}", "${b}")`}
            right={truncated ? <span className="font-mono text-[11px] text-ink-3">mostrando {fmtInt(nodes.length)} de {fmtInt(totalCalls)} nós (DFS)</span> : null}
          >
            <div ref={scroller} className="max-h-[560px] overflow-auto rounded-lg bg-surface-2/50">
              <svg width={width * scaleX * zoom} height={height * zoom} viewBox={`0 0 ${width * scaleX} ${height}`} className="block">
                {placed.map((n) =>
                  n.parent === null ? null : (
                    <line
                      key={`e${n.id}`}
                      x1={placed[n.parent].x * scaleX}
                      y1={placed[n.parent].y + NODE_H / 2}
                      x2={n.x * scaleX}
                      y2={n.y - NODE_H / 2}
                      stroke={n.duplicate ? "var(--color-dup)" : "var(--color-line-strong)"}
                      strokeOpacity={n.duplicate ? 0.35 : 1}
                      strokeWidth={1}
                    />
                  ),
                )}
                {placed.map((n) => {
                  const key = `${n.i},${n.j}`;
                  const base = n.i === 0 || n.j === 0;
                  const color = n.duplicate ? "var(--color-dup)" : base ? "var(--color-ink-3)" : "var(--color-accent)";
                  const lit = hover === key;
                  const dim = hover !== null && !lit;
                  return (
                    <g
                      key={n.id}
                      transform={`translate(${n.x * scaleX - w / 2} ${n.y - NODE_H / 2})`}
                      onPointerEnter={() => setHover(key)}
                      onPointerLeave={() => setHover(null)}
                      style={{ opacity: dim ? 0.25 : 1, transition: "opacity 150ms" }}
                      className="cursor-pointer"
                    >
                      <rect
                        width={w}
                        height={NODE_H}
                        rx={6}
                        fill={`color-mix(in oklab, ${color} ${lit ? 45 : 18}%, var(--color-surface))`}
                        stroke={color}
                        strokeWidth={lit ? 2 : 1}
                      />
                      <text x={w / 2} y={NODE_H / 2} dy="0.35em" textAnchor="middle" className="fill-ink font-mono text-[11px]">
                        {nodeText(n)}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
            {hover && (
              <p className="mt-3 font-mono text-xs text-ink-2">
                lev({hover}) aparece <span className="text-dup">{occurrences.get(hover)}×</span> nos nós desenhados; a programação dinâmica o calcula apenas 1 vez.
              </p>
            )}
          </Card>

          <Card title="Subproblemas mais recomputados (entre os nós desenhados)">
            <div className="flex flex-col gap-2">
              {topRepeated.map(([key, count]) => (
                <div key={key} className="flex items-center gap-3 font-mono text-xs">
                  <span className="w-20 text-ink-2">lev({key})</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                    <div className="h-full rounded-full bg-dup" style={{ width: `${(count / topRepeated[0][1]) * 100}%` }} />
                  </div>
                  <span className="w-12 text-right text-ink">{count}×</span>
                </div>
              ))}
            </div>
          </Card>
        </>
      }
    />
  );
}
