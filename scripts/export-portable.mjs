// Converte os caminhos absolutos (/_next/...) da exportação estática em
// relativos (./next/...), para que a pasta out/ funcione em qualquer
// subdiretório. A pasta é renomeada porque alguns hosts reservam nomes
// iniciados por "_".
import { readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { extname, join } from "node:path";

const root = process.argv[2] ?? "out";

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if ([".html", ".js", ".css"].includes(extname(p))) {
      const src = readFileSync(p, "utf8");
      const out =
        extname(p) === ".css"
          ? src.replaceAll("url(/_next/static/media/", "url(../media/")
          : src
              .replace(/(?<![\w.])\/_next\//g, "./next/")
              // U+FFFD literal (em strings dos polyfills) vira escape ASCII equivalente.
              .replaceAll("\uFFFD", "\\uFFFD");
      if (out !== src) writeFileSync(p, out);
    }
  }
}

walk(root);
renameSync(join(root, "_next"), join(root, "next"));
for (const f of ["404.html", "index.txt"]) rmSync(join(root, f), { force: true });
console.log(`Exportação portátil pronta em ${root}/`);
