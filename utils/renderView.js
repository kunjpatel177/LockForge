const ejs = require("ejs");
const fs = require("fs");
const path = require("path");

module.exports = function renderView(viewPath, data = {}) {
    const content = fs.readFileSync(
        path.join(__dirname, "../views", viewPath),
        "utf-8"
    );
    return ejs.render(content, data);
};