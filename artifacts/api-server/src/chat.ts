import { Router } from "express";

const router = Router();

router.post("/chat", async (req, res) => {
  const { message, conversationHistory = [] } = req.body;

  if (!message) {
    res.status(400).json({ error: "message is required" });
    return;
  }

  const apiKey = process.env["GROQ_API_KEY"];
  if (!apiKey) {
    res.status(500).json({ error: "GROQ_API_KEY not configured" });
    return;
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 1024,
        messages: [
          {
            role: "system",
            content: `You are an expert Indian Income Tax assistant for FY 2024-25.
You help users calculate and understand taxes under both Old and New tax regimes.
You know all heads of income: Salary, House Property, Capital Gains, Business/Profession, Other Sources.
You are familiar with all deductions: 80C, 80D, 80E, 80G, HRA, standard deduction etc.
For Capital Gains: STCG (20% u/s 111A for equity), LTCG (12.5% u/s 112A above 1.25L for equity),
indexation rules, exemptions u/s 54, 54B, 54EC, 54F.
Always quote the relevant section number. Keep answers concise and accurate.
Format numbers in Indian numbering system (lakhs, crores).`
          },
          ...conversationHistory.slice(-6),
          { role: "user", content: message }
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Groq API error: ${err}`);
    }

    const data = await response.json() as {
      choices: Array<{ message: { content: string } }>;
    };
    const reply = data.choices[0]?.message?.content ?? "Sorry, no response received.";
    res.json({ response: reply });

  } catch (err) {
    console.error("[chat] Error:", err);
    res.status(500).json({ error: "Failed to get response from AI" });
  }
});

export default router;