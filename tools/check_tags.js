const fs = require("fs");
const src = fs.readFileSync("client/src/views/ProjectsView.jsx", "utf8");
const lines = src.split("\n");
const stack = [];
let i = 0;
while (i < lines.length) {
  let line = lines[i];
  let j = 0;
  while (j < line.length) {
    const ch = line[j];
    // string literals
    if (ch === '"' || ch === "'" || ch === "`") {
      const q = ch;
      j++;
      while (j < line.length && line[j] !== q) {
        if (line[j] === "\\") j++;
        j++;
      }
      j++; // skip closing quote
      continue;
    }
    // single-line comment //
    if (ch === "/" && j + 1 < line.length && line[j + 1] === "/") {
      break; // rest of line is comment
    }
    // block comment /* */
    if (ch === "/" && j + 1 < line.length && line[j + 1] === "*") {
      let k = line.indexOf("*/", j + 2);
      if (k < 0) {
        // comment spans lines
        let end = src.indexOf("*/", i * 0 + 0);
        // find global position
        break;
      }
      j = k + 2;
      continue;
    }
    // tag open or close
    if (ch === "<") {
      const k = line.indexOf(">", j);
      if (k < 0) {
        // tag may span multiple lines (unlikely for our case)
        j++;
        continue;
      }
      const tag = line.slice(j, k + 1);
      const mClose = tag.match(/^<\/\s*([A-Za-z][A-Za-z0-9]*)/);
      const mOpen = tag.match(/^<\s*([A-Za-z][A-Za-z0-9]*)/);
      if (mClose) {
        const name = mClose[1];
        const top = stack[stack.length - 1];
        if (!top || top.name !== name) {
          console.log("MISMATCH CLOSE </" + name + "> at line", i + 1, "col", j + 1, "expected", top ? top.name : "nothing");
          process.exit(1);
        }
        stack.pop();
      } else if (mOpen && !tag.endsWith("/>")) {
        stack.push({ name: mOpen[1], line: i + 1, col: j + 1 });
      }
      j = k + 1;
      continue;
    }
    j++;
  }
  i++;
}
if (stack.length) {
  console.log("UNCLOSED tags:");
  stack.forEach((s) => console.log("  <" + s.name + "> line", s.line, "col", s.col));
} else {
  console.log("ALL JSX TAGS OK");
}
