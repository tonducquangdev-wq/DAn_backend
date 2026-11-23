const fs = require("fs");
const p = "client/src/views/ProjectsView.jsx";
const lines = fs.readFileSync(p, "utf8").split("\n");
fs.writeFileSync(p, lines.slice(0, 458).join("\n") + "\n", "utf8");
console.log("cut done, lines:", lines.slice(0, 458).length);
console.log("last 3 lines:");
lines.slice(455, 458).forEach((l, i) => console.log(456 + i, "|", l));
