import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
const root = path.resolve(import.meta.dirname, "..");
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".pdf": "application/pdf",
  ".ico": "image/x-icon",
};
http
  .createServer(async (req, res) => {
    try {
      const url = new URL(req.url, "http://localhost");
      const file = path.resolve(
        root,
        "." +
          decodeURIComponent(
            url.pathname === "/" ? "/index.html" : url.pathname,
          ),
      );
      const relative = path.relative(root, file);
      if (
        relative.startsWith("..") ||
        path.isAbsolute(relative) ||
        relative
          .split(path.sep)
          .some((p) => p.startsWith(".") || p === "node_modules")
      ) {
        res.writeHead(403).end();
        return;
      }
      if (!(await stat(file)).isFile()) {
        res.writeHead(404).end();
        return;
      }
      res.writeHead(200, {
        "Content-Type": types[path.extname(file)] || "application/octet-stream",
        "Cache-Control": "no-cache",
      });
      res.end(await readFile(file));
    } catch {
      res.writeHead(404).end("Not found");
    }
  })
  .listen(4183, "127.0.0.1", () =>
    console.log("Portfolio preview: http://127.0.0.1:4183"),
  );
