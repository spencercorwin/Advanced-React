const { createServer } = require("https");
const { parse } = require("url");
const next = require("next");
const fs = require("fs");
const path = require("path");

const certificatePath = path.join(__dirname, "..", "..", "..");
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const httpsOptions = {
  key: fs.readFileSync(path.join(certificatePath, "localhost-key.pem")),
  cert: fs.readFileSync(path.join(certificatePath, "localhost.pem"))
};

const frontEndPort = 7777;

app.prepare().then(() => {
  createServer(httpsOptions, (req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(frontEndPort, err => {
    if (err) throw err;
    console.log(`> Ready on https://localhost:${frontEndPort}`);
  });
});
