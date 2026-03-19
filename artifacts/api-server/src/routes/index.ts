import { Router } from "express";
import chatRouter from "./chat.js";
const router = Router();
router.get("/healthz", (_req, res) => {
  res.json({ status: "ok", ts: new Date().toISOString() });
});
router.use(chatRouter);
export default router;
