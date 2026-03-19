import { Router } from "express";
const router = Router();
router.post("/chat", async (req, res) => {
  const { message, conversationHistory = [] } = req.body;
  if (!message) { res.status(400).json({ error: "message is required" }); return; }
  const apiKey = process.env["GROQ_API_KEY"];
  if (!apiKey) { res.status(500).json({ error: "GROQ_API_KEY not configured" }); return; }
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 1024,
        messages: [
          { role: "system", content: "You are an expert Indian Income Tax assistant for FY 2024-25. Help users with salary, capital gains, deductions, HRA, 80C, 80D, tax regimes. Quote section numbers. Use Indian number format (lakhs/crores)." },
          ...conversationHistory.slice(-6),
          { role: "user", content: message }
        ],
      }),
    });
    if (!response.ok) { const err = await response.text(); throw new Error(err); }
    const data = await response.json() as { choices: Array<{ message: { content: string } }> };
    res.json({ response: data.choices[0]?.message?.content ?? "No response" });
  } catch (err) {
    console.error("[chat]", err);
    res.status(500).json({ error: "Failed to get AI response" });
  }
});
export default router;
