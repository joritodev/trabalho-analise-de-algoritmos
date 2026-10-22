"use client";

import { useEffect, useState } from "react";
import { memoryReport, wagnerFischerTrace } from "@/lib/levenshtein";
import { Card, Prose, Section, Segmented, Slider, SplitLayout, Stat, TextField, fmtBytes, fmtInt } from "../ui";

type CellType = "1" | "2" | "4" | "8";
const TYPE_LABEL: Record<CellType, string> = { "1": "Uint8", "2": "Uint16", "4": "Uint32", "8": "Float64" };
const SCALE_NS = [10, 100, 1_000, 10_000, 100_000, 1_000_000];
const BROWSER_LIMIT = 4 * 1024 ** 3; // ~4 GB: teto prático de memória de uma aba

export function MemoryXray() {
  const [a, setA] = useState("memoria");
  const [b, setB] = useState("otimizada");
  const [exp, setExp] = useState(3); // n = 10^exp
  const [type, setType] = useState<CellType>("4");
  const [row, setRow] = useState(1);
  const [playing, setPlaying] = useState(true);

  const bytes = Number(type);
  const n = Math.round(10 ** exp);
  const big = memoryReport(n, n, bytes);
  const trace = wagnerFischerTrace(a, b);
  const m = a.length;

  useEffect(() => {
    if (!playing || m === 0) return;
    const id = setInterval(() => setRow((r) => (r >= m ? 1 : r + 1)), 450);
    return () => clearInterval(id);
  }, [playing, m]);

  const activeRow = Math.min(row, Math.max(m, 1));
  const small = memoryReport(a.length, b.length, bytes);

  const controls = (
    <>
      <Section title="Palavras (animação)">
        <TextField label="Palavra a (linhas)" value={a} onChange={setA} maxLength={14} />
        <TextField label="Palavra b (colunas)" value={b} onChange={setB} maxLength={14} />
        <label className="flex cursor-pointer items-center gap-2 text-xs text-ink-2">
          <input type="checkbox" checked={playing} onChange={(e) => setPlaying(e.target.checked)} />
          Animar a janela de duas linhas
        </label>
      </Section>
      <Section title="Grande escala">
        <Slider label="Tamanho das palavras (m = n)" value={exp} min={1} max={6} step={0.05} onChange={setExp} format={() => fmtInt(n)} />
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-ink-2">Tipo de cada célula</span>
          <Segmented<CellType> value={type} onChange={setType} options={(Object.keys(TYPE_LABEL) as CellType[]).map((t) => ({ value: t, label: TYPE_LABEL[t] }))} />
          <span className="font-mono text-[11px] text-ink-3">{bytes} byte{bytes > 1 ? "s" : ""} por célula · o código usa Uint32Array</span>
        </div>
      </Section>
      <Section title="Por que duas linhas bastam">
        <Prose>
          <p>
            A linha <b>i</b> só lê a linha <b>i − 1</b> (vizinhas de cima e da diagonal) e a própria linha <b>i</b> (vizinha da esquerda). Tudo acima de i − 1 pode
            ser descartado.
          </p>
          <p>
            Trocando as strings para que as colunas usem a <b>mais curta</b>, o espaço fica Θ(min(m, n)). O custo é perder a matriz para o backtracking. Para
            recuperar o alinhamento em espaço linear existe o algoritmo de Hirschberg.
          </p>
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
            <Stat label={`Matriz completa (n = ${fmtInt(n)})`} value={fmtBytes(big.fullBytes)} sub={`${fmtInt(big.fullCells)} células · Θ(m·n)`} tone="var(--color-s-naive)" />
            <Stat label="Duas linhas" value={fmtBytes(big.twoRowBytes)} sub={`${fmtInt(big.twoRowCells)} células · Θ(min(m,n))`} tone="var(--color-s-uk)" />
            <Stat label="Ganho de eficiência" value={`${big.savingPercent.toFixed(big.savingPercent > 99.99 ? 4 : 2).replace(".", ",")}%`} sub="de memória poupada" tone="var(--color-accent)" />
            <Stat label="Redução" value={`${fmtInt(big.fullCells / big.twoRowCells)}×`} sub="menos memória" />
          </div>

          <div className="grid gap-5 2xl:grid-cols-2">
            <Card title={`Matriz completa: ${fmtInt(small.fullCells)} blocos alocados`} right={<span className="font-mono text-[11px] text-ink-3">{fmtBytes(small.fullBytes)}</span>}>
              <BlockGrid rows={m + 1} cols={b.length + 1} active={(i) => i <= activeRow} current={activeRow} values={trace.matrix} mode="full" />
            </Card>
            <Card title="Otimização: só 2 linhas vivas" right={<span className="font-mono text-[11px] text-ink-3">{fmtBytes(small.twoRowBytes)}</span>}>
              <BlockGrid rows={m + 1} cols={b.length + 1} active={(i) => i === activeRow || i === activeRow - 1} current={activeRow} values={trace.matrix} mode="two" />
            </Card>
          </div>

          <Card title="Comparação proporcional">
            <div className="flex flex-col gap-4">
              <Bar label="Matriz completa" value={big.fullBytes} max={big.fullBytes} color="var(--color-s-naive)" />
              <Bar label="Duas linhas" value={big.twoRowBytes} max={big.fullBytes} color="var(--color-s-uk)" />
              <p className="text-[11px] text-ink-3">
                Escala linear: a barra de duas linhas mede {(big.twoRowBytes / big.fullBytes * 100).toPrecision(2).replace(".", ",")}% da outra e quase
                desaparece. Esse é o ganho.
              </p>
            </div>
          </Card>

          <Card title={`Escalabilidade (${TYPE_LABEL[type]}, ${bytes} B/célula)`}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] font-mono text-xs tabular-nums">
                <thead>
                  <tr className="border-b border-line text-left text-ink-3">
                    <th className="py-2 pr-4 font-normal">m = n</th>
                    <th className="py-2 pr-4 font-normal">matriz completa</th>
                    <th className="py-2 pr-4 font-normal">duas linhas</th>
                    <th className="py-2 pr-4 font-normal">poupança</th>
                    <th className="py-2 font-normal">cabe numa aba do browser?</th>
                  </tr>
                </thead>
                <tbody>
                  {SCALE_NS.map((s) => {
                    const r = memoryReport(s, s, bytes);
                    const fits = r.fullBytes < BROWSER_LIMIT;
                    return (
                      <tr key={s} className="border-b border-line/60 text-ink-2">
                        <td className="py-1.5 pr-4 text-ink">{fmtInt(s)}</td>
                        <td className="py-1.5 pr-4">{fmtBytes(r.fullBytes)}</td>
                        <td className="py-1.5 pr-4">{fmtBytes(r.twoRowBytes)}</td>
                        <td className="py-1.5 pr-4">{r.savingPercent.toFixed(4).replace(".", ",")}%</td>
                        <td className="py-1.5">{fits ? <span className="text-op-match">sim</span> : <span className="text-dup">não: só a versão de 2 linhas</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      }
    />
  );
}

function BlockGrid({ rows, cols, active, current, values, mode }: {
  rows: number;
  cols: number;
  active: (i: number) => boolean;
  current: number;
  values: number[][];
  mode: "full" | "two";
}) {
  const size = cols > 12 ? 22 : 28;
  return (
    <div className="overflow-auto">
      <div className="mx-auto grid w-max gap-[3px]" style={{ gridTemplateColumns: `repeat(${cols}, ${size}px)` }}>
        {Array.from({ length: rows }, (_, i) =>
          Array.from({ length: cols }, (_, j) => {
            const live = active(i);
            const isCur = i === current;
            const style: React.CSSProperties =
              mode === "full"
                ? {
                    background: live ? `color-mix(in oklab, var(--color-s-naive) ${isCur ? 50 : 26}%, var(--color-surface-2))` : "color-mix(in oklab, var(--color-s-naive) 10%, var(--color-surface-2))",
                    color: live ? "var(--color-ink)" : "transparent",
                  }
                : {
                    background: live ? `color-mix(in oklab, var(--color-s-uk) ${isCur ? 50 : 28}%, var(--color-surface-2))` : "transparent",
                    boxShadow: live ? "none" : "inset 0 0 0 1px var(--color-line)",
                    color: live ? "var(--color-ink)" : "transparent",
                  };
            return (
              <div key={`${i},${j}`} className="flex items-center justify-center rounded-[4px] font-mono text-[10px] transition-all duration-300" style={{ ...style, width: size, height: size }}>
                {values[i]?.[j]}
              </div>
            );
          }),
        )}
      </div>
      <p className="mt-3 text-center font-mono text-[11px] text-ink-3">
        {mode === "full" ? "toda célula permanece alocada até o fim" : `linhas ${Math.max(0, current - 1)} e ${current} em memória · as restantes já foram descartadas`}
      </p>
    </div>
  );
}

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-ink-2">{label}</span>
        <span className="font-mono text-ink">{fmtBytes(value)}</span>
      </div>
      <div className="h-3 rounded-full bg-surface-2">
        <div className="h-full min-w-[3px] rounded-full transition-all duration-500" style={{ width: `${(value / max) * 100}%`, background: color }} />
      </div>
    </div>
  );
}
