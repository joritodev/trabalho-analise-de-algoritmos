"use client";

import { Card, Formula } from "../ui";
import type { ModuleId } from "../AppShell";

const APPROACHES = [
  {
    tag: "Abordagem 1",
    name: "Recursão ingênua",
    color: "var(--color-s-naive)",
    worst: "Ω(4ⁿ/n) ≤ T(n) ≤ O(9ⁿ)",
    tight: "Θ((1+√2)²ⁿ/√n) ≈ 5,83ⁿ",
    space: "O(m + n) de pilha",
    proof: "Indução: T ≤ 3^(m+n); Pascal: T ≥ C(m+n, m)",
  },
  {
    tag: "Abordagem 2",
    name: "Wagner-Fischer (PD)",
    color: "var(--color-s-wf)",
    worst: "Θ(m · n)",
    tight: "exatamente m·n células internas",
    space: "Θ(m·n) → Θ(min(m, n))",
    proof: "Somatório duplo de custo constante",
  },
  {
    tag: "Abordagem 3",
    name: "Ukkonen (faixa diagonal)",
    color: "var(--color-s-uk)",
    worst: "Θ(k · min(m, n))",
    tight: "(2k+1)·n − k(k+1) para a = b",
    space: "Θ(min(m, n))",
    proof: "≤ 2k+1 células por linha; a = b atinge o limite",
  },
];

const MODULES: { id: ModuleId; letter: string; title: string; desc: string }[] = [
  { id: "matrix", letter: "A", title: "Simulador da matriz", desc: "Preenchimento passo a passo, operações coloridas e backtracking." },
  { id: "bench", letter: "B", title: "Stress test", desc: "Operações × n ao vivo, num Web Worker. A recursão trava; a PD não." },
  { id: "tree", letter: "C", title: "Árvore de recorrência", desc: "Ramos de chamadas com os subproblemas repetidos em vermelho." },
  { id: "ukkonen", letter: "D", title: "Corte de Ukkonen", desc: "Slider de k aplica a máscara diagonal em tempo real." },
  { id: "memory", letter: "E", title: "Raio-X de memória", desc: "Matriz completa × duas linhas ativas, até n = 10⁶." },
];

export function Overview({ go }: { go: (id: ModuleId) => void }) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-4 sm:p-8">
      <header className="flex flex-col gap-3 animate-fade-up">
        <span className="font-mono text-xs tracking-[0.14em] text-accent uppercase">Análise de Algoritmos · Projeto final</span>
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Busca aproximada em tempo real: otimizando a distância de Levenshtein
        </h1>
        <p className="max-w-2xl text-[15px] leading-relaxed text-ink-2">
          Três algoritmos para o mesmo problema, do exponencial ao quase linear. Cada limite de pior caso é provado no relatório e verificado aqui,
          empiricamente, contando operações reais.
        </p>
        <Formula>
          lev(a, b) = número mínimo de inserções, deleções e substituições que transformam a em b · ex.: lev(&quot;kitten&quot;, &quot;sitting&quot;) = 3
        </Formula>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {APPROACHES.map((ap) => (
          <div key={ap.name} className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-5" style={{ borderTop: `2px solid ${ap.color}` }}>
            <div>
              <div className="font-mono text-[11px] tracking-wider text-ink-3 uppercase">{ap.tag}</div>
              <div className="text-lg font-semibold text-ink">{ap.name}</div>
            </div>
            <dl className="flex flex-col gap-2 text-xs">
              <Row k="Pior caso" v={<span className="text-sm font-semibold" style={{ color: ap.color }}>{ap.worst}</span>} />
              <Row k="Exato" v={ap.tight} />
              <Row k="Espaço" v={ap.space} />
              <Row k="Prova" v={ap.proof} />
            </dl>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-[11px] tracking-[0.12em] text-ink-3 uppercase">Módulos interativos</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {MODULES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => go(m.id)}
              className="group flex flex-col gap-2 rounded-xl border border-line bg-surface p-4 text-left transition hover:-translate-y-0.5 hover:border-line-strong hover:bg-surface-2"
            >
              <span className="flex size-7 items-center justify-center rounded-md bg-surface-3 font-mono text-xs text-accent">{m.letter}</span>
              <span className="text-sm font-medium text-ink">{m.title}</span>
              <span className="text-xs leading-relaxed text-ink-3">{m.desc}</span>
              <span className="mt-auto font-mono text-[11px] text-ink-3 transition group-hover:text-accent">abrir →</span>
            </button>
          ))}
        </div>
      </section>

      <Card title="Hierarquia assintótica (pior caso, m = n)">
        <div className="font-mono text-sm text-ink-2">
          <span className="text-s-uk">Θ(k·n)</span> <span className="text-ink-3">≪</span> <span className="text-s-wf">Θ(n²)</span>{" "}
          <span className="text-ink-3">≪</span> <span className="text-s-naive">Θ(5,83ⁿ/√n)</span>
          <span className="ml-3 text-xs text-ink-3">para k fixo e n → ∞</span>
        </div>
      </Card>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-ink-3">{k}</dt>
      <dd className="font-mono text-ink-2">{v}</dd>
    </div>
  );
}
