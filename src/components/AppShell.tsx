"use client";

import { useEffect, useState } from "react";
import { Benchmark } from "./modules/Benchmark";
import { MatrixSimulator } from "./modules/MatrixSimulator";
import { MemoryXray } from "./modules/MemoryXray";
import { Overview } from "./modules/Overview";
import { RecursionTree } from "./modules/RecursionTree";
import { UkkonenCut } from "./modules/UkkonenCut";

export type ModuleId = "overview" | "matrix" | "bench" | "tree" | "ukkonen" | "memory";

const TABS: { id: ModuleId; letter?: string; label: string }[] = [
  { id: "overview", label: "Visão geral" },
  { id: "matrix", letter: "A", label: "Matriz" },
  { id: "bench", letter: "B", label: "Benchmark" },
  { id: "tree", letter: "C", label: "Árvore" },
  { id: "ukkonen", letter: "D", label: "Ukkonen" },
  { id: "memory", letter: "E", label: "Memória" },
];

export function AppShell() {
  const [active, setActive] = useState<ModuleId>("overview");

  // Sincroniza o módulo ativo com o hash da URL (permite compartilhar links diretos).
  useEffect(() => {
    const fromHash = () => {
      const id = window.location.hash.slice(1) as ModuleId;
      if (TABS.some((t) => t.id === id)) setActive(id);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, []);

  const go = (id: ModuleId) => {
    setActive(id);
    history.replaceState(null, "", `#${id}`);
  };

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex shrink-0 flex-col gap-3 border-b border-line bg-bg/80 px-4 py-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <button type="button" onClick={() => go("overview")} className="flex items-center gap-2.5 text-left">
          <span className="flex size-8 items-center justify-center rounded-lg bg-accent/15 font-mono text-sm font-semibold text-accent">Δ</span>
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-ink">Levenshtein Lab</span>
            <span className="font-mono text-[11px] text-ink-3">FB UNI · Análise de Algoritmos</span>
          </span>
        </button>
        <nav className="-mx-1 flex gap-1 overflow-x-auto px-1" aria-label="Módulos">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => go(t.id)}
              aria-current={active === t.id ? "page" : undefined}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition ${
                active === t.id ? "bg-surface-3 text-ink" : "text-ink-3 hover:bg-surface-2 hover:text-ink-2"
              }`}
            >
              {t.letter && (
                <span className={`font-mono text-[11px] ${active === t.id ? "text-accent" : "text-ink-3"}`}>{t.letter}</span>
              )}
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <div key={active} className="flex min-h-0 flex-1 flex-col overflow-auto animate-fade-up lg:overflow-hidden">
        {active === "overview" && <div className="min-h-0 flex-1 overflow-auto"><Overview go={go} /></div>}
        {active === "matrix" && <MatrixSimulator />}
        {active === "bench" && <Benchmark />}
        {active === "tree" && <RecursionTree />}
        {active === "ukkonen" && <UkkonenCut />}
        {active === "memory" && <MemoryXray />}
      </div>
    </div>
  );
}
