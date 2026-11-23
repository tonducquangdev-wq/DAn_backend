const fs = require("fs");
const parser = require("d:/laragon/laragon/www/test_backend/client/node_modules/@babel/parser");
const src = fs.readFileSync("d:/laragon/laragon/www/test_backend/client/src/views/ProjectsView.jsx", "utf8");
try {
  parser.parse(src, { sourceType: "module", plugins: ["jsx"] });
  console.log("PARSE OK");
} catch (e) {
  console.log("PARSE ERROR:", e.message);
  console.log("LOC:", e.loc ? JSON.stringify(e.loc) : "none");
  if (e.loc && e.loc.line) {
    const lines = src.split("\n");
    console.log("--- context ---");
    for (let i = Math.max(1, e.loc.line - 3); i <= Math.min(lines.length, e.loc.line + 3); i++) {
      console.log(i, "|", lines[i - 1]);
    }
  }
}
