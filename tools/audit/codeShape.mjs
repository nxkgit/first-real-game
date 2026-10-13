// Read-only code-shape metrics via the TypeScript compiler API: long functions, class sizes, any, TODOs, comment ratio.
import ts from 'typescript';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (p.endsWith('.ts') && !p.endsWith('.test.ts') && !p.endsWith('.d.ts')) files.push(p);
  }
})(path.join(ROOT, 'src'));

const longFns = [];
const classes = [];
let anyCount = 0, asCount = 0, todo = 0, codeLines = 0, commentLines = 0, nonNullBang = 0, tsIgnore = 0;
for (const f of files) {
  const text = fs.readFileSync(f, 'utf8');
  const sf = ts.createSourceFile(f, text, ts.ScriptTarget.Latest, true);
  const lines = text.split('\n');
  for (const l of lines) {
    const t = l.trim();
    if (!t) continue;
    if (t.startsWith('//') || t.startsWith('*') || t.startsWith('/*')) commentLines++; else codeLines++;
  }
  todo += (text.match(/TODO|FIXME|HACK/g) ?? []).length;
  tsIgnore += (text.match(/@ts-ignore|@ts-expect-error|eslint-disable/g) ?? []).length;
  const visit = (n) => {
    if (n.kind === ts.SyntaxKind.AnyKeyword) anyCount++;
    if (ts.isAsExpression(n)) asCount++;
    if (ts.isNonNullExpression(n)) nonNullBang++;
    if (ts.isFunctionDeclaration(n) || ts.isMethodDeclaration(n) || ts.isArrowFunction(n) || ts.isFunctionExpression(n)) {
      if (n.body) {
        const a = sf.getLineAndCharacterOfPosition(n.getStart()).line;
        const b = sf.getLineAndCharacterOfPosition(n.getEnd()).line;
        const name = n.name?.getText() ?? (ts.isVariableDeclaration(n.parent) ? n.parent.name.getText() : ts.isPropertyAssignment(n.parent) ? n.parent.name.getText() : '(anon)');
        // count branching nodes as a crude complexity
        let cx = 1;
        const walkC = (m) => {
          if (ts.isIfStatement(m) || ts.isForStatement(m) || ts.isForOfStatement(m) || ts.isForInStatement(m) || ts.isWhileStatement(m) || ts.isCaseClause(m) || ts.isConditionalExpression(m) || ts.isCatchClause(m)) cx++;
          if (ts.isBinaryExpression(m) && (m.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken || m.operatorToken.kind === ts.SyntaxKind.BarBarToken || m.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken)) cx++;
          ts.forEachChild(m, walkC);
        };
        ts.forEachChild(n.body, walkC);
        if (b - a + 1 >= 45 || cx >= 18) longFns.push({ f: path.relative(ROOT, f).replace(/\\/g, '/'), name, len: b - a + 1, cx });
      }
    }
    if (ts.isClassDeclaration(n) && n.name) {
      const members = n.members.length;
      const methods = n.members.filter((m) => ts.isMethodDeclaration(m)).length;
      const fields = n.members.filter((m) => ts.isPropertyDeclaration(m)).length;
      const a = sf.getLineAndCharacterOfPosition(n.getStart()).line;
      const b = sf.getLineAndCharacterOfPosition(n.getEnd()).line;
      classes.push({ f: path.relative(ROOT, f).replace(/\\/g, '/'), name: n.name.text, members, methods, fields, len: b - a + 1 });
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
}
console.log('files', files.length, 'code lines', codeLines, 'comment lines', commentLines, `(${Math.round((100 * commentLines) / (codeLines + commentLines))}% comments)`);
console.log('any:', anyCount, ' "as" casts:', asCount, ' non-null "!":', nonNullBang, ' TODO/FIXME:', todo, ' ts-ignore/eslint-disable:', tsIgnore);
console.log('\n## classes by size');
for (const c of classes.sort((a, b) => b.len - a.len).slice(0, 12)) console.log(c);
console.log('\n## long functions (>=45 lines or complexity >=18)');
for (const x of longFns.sort((a, b) => b.len - a.len).slice(0, 30)) console.log(x.len, 'cx', x.cx, x.f, x.name);
