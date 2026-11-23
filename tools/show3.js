const fs = require("fs");
const lines = fs.readFileSync("d:/laragon/laragon/www/test_backend/client/src/views/ProjectsView.jsx", "utf8").split("\n");
for (let i = 510; i <= 562; i++) {
  console.log(i, "|", lines[i - 1]);
}
