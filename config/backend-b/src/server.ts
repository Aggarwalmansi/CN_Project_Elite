import express, { Request, Response } from "express";

const app = express();

const HOST = "0.0.0.0";
const PORT = 3002;

app.use(express.json());

app.use((_req: Request, res: Response, next) => {
  res.setHeader("X-Backend", "B");
  next();
});

app.get("/", (_req: Request, res: Response) => {
  res.json({
    backend: "B",
    status: "ok",
    message: "Backend B is running"
  });
});

app.get("/api/status", (_req: Request, res: Response) => {
  res.json({
    backend: "B",
    status: "ok"
  });
});

app.get("/api/cache", (req: Request, res: Response) => {
  const etag = '"cache-v1"';

  res.setHeader("Cache-Control", "max-age=60");
  res.setHeader("ETag", etag);

  if (req.headers["if-none-match"] === etag) {
    return res.status(304).end();
  }

  res.json({
    backend: "B",
    cached: true,
    message: "This response supports HTTP caching"
  });
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Not Found" });
});

app.listen(PORT, HOST, () => {
  console.log(`Backend B running on http://${HOST}:${PORT}`);
});
