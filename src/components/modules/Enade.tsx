"use client";

import { useState, type ReactNode } from "react";
import { Formula } from "../ui";

interface Question {
  id: string;
  title: string;
  topic: string;
  base: ReactNode;
  prompt: string;
  alternatives: { letter: string; text: string; why: string }[];
  answer: string;
  explanation: ReactNode;
  module: string;
}

const ASSERTION_ALTERNATIVES = [
  "As asserções I e II são proposições verdadeiras, e a II é uma justificativa correta da I.",
  "As asserções I e II são proposições verdadeiras, mas a II não é uma justificativa correta da I.",
  "A asserção I é uma proposição verdadeira, e a II é uma proposição falsa.",
  "A asserção I é uma proposição falsa, e a II é uma proposição verdadeira.",
  "As asserções I e II são proposições falsas.",
];

export const QUESTIONS: Question[] = [
  {
    id: "q1",
    title: "Questão 1",
    topic: "Complexidade espacial da recursão",
    module: "Módulos C (Árvore) e B (gráfico de memória)",
    base: (
      <>
        <p>Um corretor ortográfico calcula a distância de Levenshtein entre duas palavras a e b, de tamanhos m e n, com a função recursiva a seguir, sem memoização.</p>
        <Formula>
          lev(i, j):
          <br />
          &nbsp;&nbsp;se i = 0: retorne j
          <br />
          &nbsp;&nbsp;se j = 0: retorne i
          <br />
          &nbsp;&nbsp;c ← 0 se a[i] = b[j], senão 1
          <br />
          &nbsp;&nbsp;retorne min(lev(i−1, j) + 1, lev(i, j−1) + 1, lev(i−1, j−1) + c)
        </Formula>
        <p>
          Em testes com palavras de 12 letras, a função executou cerca de 3,8 · 10⁸ chamadas. Ainda assim, o consumo de memória permaneceu pequeno durante
          toda a execução.
        </p>
        <p>Considerando essa situação, avalie as asserções a seguir e a relação proposta entre elas.</p>
        <ol className="list-none space-y-2 pl-0">
          <li>
            <b>I.</b> Embora o tempo de execução dessa função seja exponencial, sua complexidade espacial é O(m + n).
          </li>
          <li className="font-semibold text-ink">PORQUE</li>
          <li>
            <b>II.</b> Em cada instante, a pilha de execução contém apenas as chamadas do caminho entre a chamada inicial e a chamada atual, e cada chamada
            reduz o valor de i + j em pelo menos uma unidade.
          </li>
        </ol>
      </>
    ),
    prompt: "A respeito dessas asserções, assinale a opção correta.",
    alternatives: ASSERTION_ALTERNATIVES.map((text, i) => ({
      letter: "ABCDE"[i],
      text,
      why: [
        "Correta. I é verdadeira e II explica exatamente por quê: a profundidade máxima da pilha é m + n.",
        "Incorreta. II não é apenas verdadeira: ela é a justificativa direta de I.",
        "Incorreta. II é verdadeira: chamadas de ramos já encerrados são desempilhadas, e cada chamada filha diminui i, j ou ambos.",
        "Incorreta. I é verdadeira. Tempo e espaço são medidas diferentes; tempo exponencial não implica espaço exponencial.",
        "Incorreta. As duas asserções são verdadeiras.",
      ][i],
    })),
    answer: "A",
    explanation: (
      <>
        <p>
          A árvore de chamadas tem um número exponencial de nós, mas ela é percorrida em profundidade: quando um ramo termina, suas chamadas saem da pilha. Só
          ficam empilhadas as chamadas do caminho da raiz até o nó atual.
        </p>
        <p>
          Como cada chamada filha reduz i + j em pelo menos 1, o caminho tem no máximo m + n chamadas, cada uma com memória O(1). Logo o espaço é O(m + n). O
          teste do projeto mede essa profundidade e obtém exatamente m + n para todo n.
        </p>
      </>
    ),
  },
  {
    id: "q2",
    title: "Questão 2",
    topic: "Pior caso, melhor caso e corte do algoritmo de Ukkonen",
    module: "Módulo D (Ukkonen)",
    base: (
      <>
        <p>
          Em sistemas de busca aproximada, não interessa a distância exata entre palavras muito diferentes. Basta saber se lev(a, b) ≤ k, para um limiar k
          pequeno.
        </p>
        <p>
          O algoritmo de Ukkonen faz isso preenchendo apenas as células (i, j) da matriz de programação dinâmica que satisfazem |i − j| ≤ k, mantendo somente
          duas linhas em memória. Além disso, ele responde imediatamente &quot;distância maior que k&quot; quando ||a| − |b|| &gt; k, e encerra a execução
          quando todas as células calculadas de uma linha excedem k.
        </p>
        <p>Considerando esse algoritmo, avalie as afirmações a seguir.</p>
        <ol className="list-none space-y-2 pl-0">
          <li>
            <b>I.</b> Para k constante, o tempo de execução no pior caso é O(n), em que n = min(|a|, |b|), pois cada linha tem no máximo 2k + 1 células
            calculadas.
          </li>
          <li>
            <b>II.</b> O melhor caso tem custo Ω(1) e ocorre, por exemplo, quando a diferença entre os comprimentos das palavras é maior que k.
          </li>
          <li>
            <b>III.</b> O algoritmo sempre devolve o valor exato da distância de Levenshtein, para qualquer par de palavras e qualquer valor de k.
          </li>
          <li>
            <b>IV.</b> O pior caso ocorre quando as palavras são completamente diferentes, pois nenhuma célula da faixa pode ser descartada.
          </li>
        </ol>
      </>
    ),
    prompt: "É correto apenas o que se afirma em",
    alternatives: [
      { letter: "A", text: "I e III.", why: "Incorreta. III é falsa: quando a distância é maior que k, o algoritmo só informa \"maior que k\"." },
      { letter: "B", text: "II e IV.", why: "Incorreta. IV é falsa: palavras muito diferentes disparam o corte antecipado logo nas primeiras linhas." },
      { letter: "C", text: "I e II.", why: "Correta. I e II são verdadeiras; III e IV são falsas." },
      { letter: "D", text: "I, II e IV.", why: "Incorreta. IV é falsa: o pior caso são palavras parecidas (no limite, iguais), em que nenhum corte acontece." },
      { letter: "E", text: "II, III e IV.", why: "Incorreta. III e IV são falsas, e I, que é verdadeira, ficou de fora." },
    ],
    answer: "C",
    explanation: (
      <>
        <p>
          <b>I (verdadeira):</b> cada linha calcula no máximo 2k + 1 células e só se chega ao laço quando m ≤ n + k. Logo T = O(k · n), que é O(n) para k
          constante. Com a = b, o total exato é (2k + 1)n − k(k + 1).
        </p>
        <p>
          <b>II (verdadeira):</b> se ||a| − |b|| &gt; k, a resposta sai sem calcular célula alguma.
        </p>
        <p>
          <b>III (falsa):</b> o valor só é exato quando a distância é ≤ k. Acima disso, o algoritmo responde apenas &quot;maior que k&quot;.
        </p>
        <p>
          <b>IV (falsa):</b> palavras muito diferentes fazem os valores de uma linha inteira passarem de k cedo, e o algoritmo para. O pior caso são palavras
          parecidas, em que a faixa inteira é calculada.
        </p>
      </>
    ),
  },
];

export function Enade() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 p-4 sm:p-8">
      <header className="flex flex-col gap-2">
        <span className="font-mono text-xs tracking-[0.14em] text-accent uppercase">Questões modelo ENADE</span>
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Análise de algoritmos aplicada à distância de Levenshtein</h1>
        <p className="text-[15px] leading-relaxed text-ink-2">Escolha uma alternativa para ver se acertou. A resolução comentada aparece em seguida.</p>
      </header>
      {QUESTIONS.map((q) => (
        <QuestionCard key={q.id} q={q} />
      ))}
    </div>
  );
}

function QuestionCard({ q }: { q: Question }) {
  const [chosen, setChosen] = useState<string | null>(null);
  const [reveal, setReveal] = useState(false);
  const show = reveal || chosen !== null;

  return (
    <article className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold text-ink">{q.title}</h2>
        <span className="font-mono text-[11px] text-ink-3">{q.topic}</span>
      </div>
      <div className="flex flex-col gap-3 text-[14px] leading-relaxed text-ink-2 [&_b]:font-medium [&_b]:text-ink">{q.base}</div>
      <p className="text-[14px] font-medium text-ink">{q.prompt}</p>

      <div className="flex flex-col gap-2">
        {q.alternatives.map((alt) => {
          const isAnswer = alt.letter === q.answer;
          const isChosen = alt.letter === chosen;
          const tone = !show ? "var(--color-line)" : isAnswer ? "var(--color-op-match)" : isChosen ? "var(--color-dup)" : "var(--color-line)";
          return (
            <button
              key={alt.letter}
              type="button"
              onClick={() => setChosen(alt.letter)}
              className="flex flex-col gap-1 rounded-lg border px-4 py-3 text-left transition hover:bg-surface-2"
              style={{ borderColor: tone, background: show && (isAnswer || isChosen) ? `color-mix(in oklab, ${tone} 10%, transparent)` : undefined }}
            >
              <span className="flex gap-3 text-[14px] text-ink">
                <span className="font-mono font-semibold" style={{ color: show && (isAnswer || isChosen) ? tone : "var(--color-ink-3)" }}>
                  {alt.letter}
                </span>
                {alt.text}
              </span>
              {show && (isAnswer || isChosen) && <span className="pl-7 text-xs text-ink-2 animate-fade-up">{alt.why}</span>}
            </button>
          );
        })}
      </div>

      {!show && (
        <button type="button" onClick={() => setReveal(true)} className="self-start text-xs text-ink-3 underline-offset-4 hover:text-ink-2 hover:underline">
          Mostrar gabarito sem responder
        </button>
      )}

      {show && (
        <div className="flex flex-col gap-2 rounded-lg border border-line bg-surface-2 p-4 text-[13px] leading-relaxed text-ink-2 animate-fade-up [&_b]:font-medium [&_b]:text-ink">
          <div className="font-mono text-xs text-op-match">
            Gabarito: {q.answer}
            {chosen && (chosen === q.answer ? " · você acertou" : ` · você marcou ${chosen}`)}
          </div>
          {q.explanation}
          <div className="font-mono text-[11px] text-ink-3">Demonstração no site: {q.module}</div>
          <button type="button" onClick={() => { setChosen(null); setReveal(false); }} className="self-start text-xs text-ink-3 hover:text-ink-2">
            ↺ refazer
          </button>
        </div>
      )}
    </article>
  );
}
