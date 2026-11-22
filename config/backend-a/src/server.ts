import express, { Request, Response } from "express";

const app = express();

const HOST = "0.0.0.0";
const PORT = 3001;

// Parse JSON request bodies
app.use(express.json());

// Middleware to identify Backend A
app.use((_req: Request, res: Response, next) => {
  res.setHeader("X-Backend", "A");
  next();
});

// Home endpoint
app.get("/", (_req: Request, res: Response) => {
  res.json({
    backend: "A",
    status: "ok",
    message: "Backend A is running"
  });
});

// Status endpoint
app.get("/api/status", (_req: Request, res: Response) => {
  res.json({
    backend: "A",
    status: "ok"
  });
});

// Cache endpoint
app.get("/api/cache", (req: Request, res: Response) => {

  const etag = '"cache-v1"';

  // Check whether client already has this version
  if (req.headers["if-none-match"] === etag) {
    res.status(304);
    res.setHeader("Cache-Control", "max-age=60");
    res.setHeader("ETag", etag);
    return res.end();
  }

  res.setHeader("Cache-Control", "max-age=60");
  res.setHeader("ETag", etag);

  res.json({
    backend: "A",
    cached: true,
    message: "This response supports HTTP caching"
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: "Not Found"
  });
});

// Start server
app.listen(PORT, HOST, () => {
  console.log(`Backend A running on http://${HOST}:${PORT}`);
});
