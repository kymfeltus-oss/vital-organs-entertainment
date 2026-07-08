import { Router } from "express";

import { recognizeSong } from "../../../lib/recognize-song.js";
import type { RecognizeRequest } from "../../../shared/types.js";

export const recognizeRouter = Router();

recognizeRouter.post("/recognize", async (req, res) => {
  try {
    const body = req.body as RecognizeRequest;
    const overview = await recognizeSong(body);
    res.json(overview);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Recognition failed";
    res.status(502).json({ error: message });
  }
});
