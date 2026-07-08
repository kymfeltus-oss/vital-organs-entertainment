import cors from "cors";
import express from "express";

import { recognizeRouter } from "./routes/recognize.js";

const PORT = Number(process.env.COLEMAN_API_PORT ?? 4780);

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "coleman-api" });
});

app.use("/api", recognizeRouter);

app.listen(PORT, () => {
  console.log(`Coleman API listening on http://localhost:${PORT}`);
});
