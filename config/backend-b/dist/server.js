"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
const HOST = "0.0.0.0";
const PORT = 3002;
app.use(express_1.default.json());
app.use((_req, res, next) => {
    res.setHeader("X-Backend", "B");
    next();
});
app.get("/", (_req, res) => {
    res.json({
        backend: "B",
        status: "ok",
        message: "Backend B is running"
    });
});
app.get("/api/status", (_req, res) => {
    res.json({
        backend: "B",
        status: "ok"
    });
});
app.get("/api/cache", (req, res) => {
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
app.use((_req, res) => {
    res.status(404).json({ error: "Not Found" });
});
app.listen(PORT, HOST, () => {
    console.log(`Backend B running on http://${HOST}:${PORT}`);
});
