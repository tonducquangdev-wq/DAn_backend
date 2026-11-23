const fs = require("fs");
const lines = fs.readFileSync("client/src/views/ProjectsView.jsx", "utf8").split("\n");
const stack = [];
const reOpen = /<div\b/gi;
const reClose = /<\/div>/gi;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  let m;
  reOpen.lastIndex = 0;
  while ((m = reOpen.exec(line)) !== null) {
    stack.push({ line: i + 1, col: m.index + 1 });
  }
  reClose.lastIndex = 0;
  while ((m = reClose.exec(line)) !== null) {
    if (stack.length === 0) {
      console.log("EXTRA CLOSE at line", i + 1, "col", m.index + 1);
      process.exit(1);
    }
    stack.pop();
  }
}
if (stack.length) {
  console.log("UNCLOSED div stack:");
  stack.forEach((s) => console.log("  line", s.line, "col", s.col));
} else {
  console.log("div nesting OK");
}
