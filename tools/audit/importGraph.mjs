// Read-only import-graph analysis of src/: layering, cycles, unused exports. Run from the repo root.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (p.endsWith('.ts')) files.push(p);
  }
})(path.join(ROOT, 'src'));

const rel = (p) => path.relative(ROOT, p).replace(/\\/g, '/');
const isTest = (f) => /\.test\.ts$/.test(f);
const resolve = (from, spec) => {
  if (!spec.startsWith('.')) return null;
  const base = path.resolve(path.dirname(from), spec);
  for (const c of [base + '.ts', path.join(base, 'index.ts')]) if (fs.existsSync(c)) return c;
  return null;
};

const edges = new Map(); // file -> Set(file)
const phaser = new Set();
const exportsOf = new Map(); // file -> names
const importedNames = new Map(); // file -> Set(names imported by non-test files)
const importedByTests = new Map();
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  const set = new Set();
  edges.set(f, set);
  if (/from 'phaser'/.test(src)) phaser.add(f);
  for (const m of src.matchAll(/(?:import|export)\s+(type\s+)?([^;]*?)\s+from\s+'([^']+)'/g)) {
    const target = resolve(f, m[3]);
    if (!target) continue;
    if (!m[1]) set.add(target); // type-only imports do not create a runtime edge
    const names = [...m[2].matchAll(/\b([A-Za-z_$][\w$]*)\b/g)].map((x) => x[1]).filter((n) => !['as', 'type'].includes(n));
    const bucket = isTest(f) ? importedByTests : importedNames;
    if (!bucket.has(target)) bucket.set(target, new Set());
    for (const n of names) bucket.get(target).add(n);
  }
  const ex = new Set();
  for (const m of src.matchAll(/export\s+(?:declare\s+)?(?:const|function|class|interface|type|enum|let)\s+([A-Za-z_$][\w$]*)/g)) ex.add(m[1]);
  exportsOf.set(f, ex);
}

const dirOf = (f) => rel(f).split('/').slice(0, 2).join('/');
const topOf = (f) => rel(f).split('/')[1];

// directory-level runtime edges (non-test files only)
const dirEdges = new Map();
for (const [f, tos] of edges) {
  if (isTest(f)) continue;
  for (const t of tos) {
    if (isTest(t)) continue;
    const a = topOf(f), b = topOf(t);
    if (a === b) continue;
    const k = `${a} -> ${b}`;
    dirEdges.set(k, (dirEdges.get(k) ?? 0) + 1);
  }
}
console.log('## directory runtime edges (count of file imports)');
for (const [k, v] of [...dirEdges].sort()) console.log(`${k}: ${v}`);

console.log('\n## files importing phaser');
const phaserDirs = {};
for (const f of phaser) phaserDirs[topOf(f)] = (phaserDirs[topOf(f)] ?? 0) + 1;
console.log(phaserDirs);
console.log([...phaser].filter((f) => !['scenes', 'audio'].includes(topOf(f))).map(rel));

// cycles: Tarjan SCC over non-test runtime edges
const nodes = files.filter((f) => !isTest(f));
let index = 0;
const idx = new Map(), low = new Map(), onStack = new Set(), stack = [], sccs = [];
function strong(v) {
  idx.set(v, index); low.set(v, index); index++;
  stack.push(v); onStack.add(v);
  for (const w of edges.get(v) ?? []) {
    if (isTest(w)) continue;
    if (!idx.has(w)) { strong(w); low.set(v, Math.min(low.get(v), low.get(w))); }
    else if (onStack.has(w)) low.set(v, Math.min(low.get(v), idx.get(w)));
  }
  if (low.get(v) === idx.get(v)) {
    const comp = [];
    let w;
    do { w = stack.pop(); onStack.delete(w); comp.push(w); } while (w !== v);
    if (comp.length > 1) sccs.push(comp);
  }
}
for (const v of nodes) if (!idx.has(v)) strong(v);
console.log('\n## runtime import cycles (strongly connected groups)');
for (const c of sccs) console.log(c.length, c.map(rel).join(', '));

// unused exports (never imported by name from another non-test file, and not by tests either)
console.log('\n## exports not imported anywhere else by name (non-test files)');
let total = 0, unusedProd = 0;
const rows = [];
for (const f of nodes) {
  const used = importedNames.get(f) ?? new Set();
  const usedT = importedByTests.get(f) ?? new Set();
  for (const n of exportsOf.get(f)) {
    total++;
    if (!used.has(n)) {
      const inFile = fs.readFileSync(f, 'utf8');
      const uses = [...inFile.matchAll(new RegExp(`\\b${n}\\b`, 'g'))].length;
      rows.push({ f: rel(f), n, onlyTests: usedT.has(n), internal: uses > 1 });
      unusedProd++;
    }
  }
}
console.log(`exports: ${total}, not imported by other production files: ${unusedProd}`);
const grouped = {};
for (const r of rows) (grouped[r.f] ??= []).push(`${r.n}${r.onlyTests ? '(tests)' : r.internal ? '(internal)' : '(UNUSED)'}`);
for (const [f, ns] of Object.entries(grouped)) if (ns.some((n) => n.endsWith('(UNUSED)'))) console.log(f, ns.filter((n) => n.endsWith('(UNUSED)')).join(' '));

// biggest fan-in / fan-out
const fanIn = new Map();
for (const [f, tos] of edges) if (!isTest(f)) for (const t of tos) if (!isTest(t)) fanIn.set(t, (fanIn.get(t) ?? 0) + 1);
console.log('\n## highest fan-in (imported by N production files)');
for (const [f, n] of [...fanIn].sort((a, b) => b[1] - a[1]).slice(0, 10)) console.log(n, rel(f));
console.log('\n## highest fan-out (imports N production files)');
for (const [f, tos] of [...edges].filter(([f]) => !isTest(f)).map(([f, t]) => [f, [...t].filter((x) => !isTest(x))]).sort((a, b) => b[1].length - a[1].length).slice(0, 10)) console.log(tos.length, rel(f));
