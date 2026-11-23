const fs = require("fs");
const lines = fs.readFileSync("client/src/views/ProjectsView.jsx", "utf8").split("\n");
for (let i = 915; i <= 935; i++) {
  console.log(i, "|", lines[i - 1]);
}
