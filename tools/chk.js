try {
  const p = require.resolve("prettier", { paths: ["client"] });
  console.log("PRETTIER_AT", p);
} catch (e) {
  console.log("NO_PRETTIER", e.message);
}
try {
  const p = require.resolve("@babel/parser", { paths: ["client"] });
  console.log("BABEL_AT", p);
} catch (e) {
  console.log("NO_BABEL", e.message);
}
