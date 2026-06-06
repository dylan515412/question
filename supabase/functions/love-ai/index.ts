const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type LoveAITask = "monthly_report";

type LoveAIRequest = {
  task: LoveAITask;
  memory?: Record<string, unknown>;
  payload?: Record<string, unknown>;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function systemPrompt(task: LoveAITask) {
  const base =
    "你是一个高级、克制、温暖的恋爱记忆系统。只基于用户提供的真实记忆输出，不编造具体事实。语言要自然、细腻、不过度油腻。必须返回严格 JSON，不要 Markdown。";

  return `${base} 当前任务：基于上个月的每日记录、情书和照片文字线索，生成一本月度恋爱回忆册总结，像私人记忆编辑，而不是普通总结。`;
}

function userPrompt(request: LoveAIRequest) {
  return JSON.stringify({
    instruction:
      "根据 payload.monthlyRecords 里上个月的每日记录、情书和照片文字线索，生成高级但真诚的月度回忆册总结。必须调用这些真实记录来归纳，不要编造未提供的具体事件。",
    memory: request.memory,
    payload: request.payload,
    output_schema: {
      report: {
        monthTitle: "string",
        summary: "string",
        keywords: ["string"],
        memoryCount: "number",
        highlight: "string",
        photoCount: "number",
        wordsCount: "number",
        quote: "string",
      },
    },
  });
}

function safeParseModelJson(text: string) {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  return JSON.parse(cleaned);
}

function completionUrlFromBaseUrl(baseUrl: string) {
  const normalized = baseUrl.replace(/\/+$/, "");
  if (normalized.endsWith("/chat/completions")) return normalized;
  return `${normalized}/chat/completions`;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const apiKey = Deno.env.get("AI_API_KEY") || Deno.env.get("OPENAI_API_KEY");
  const baseUrl = (Deno.env.get("AI_BASE_URL") || Deno.env.get("OPENAI_BASE_URL") || "https://api.deepseek.com")
    .replace(/\/+$/, "");
  const model = Deno.env.get("AI_MODEL") || "deepseek-v4-flash";

  if (!apiKey) {
    return jsonResponse({ error: "Missing AI_API_KEY" }, 500);
  }

  const body = (await request.json()) as LoveAIRequest;
  if (body.task !== "monthly_report") {
    return jsonResponse({ error: "Unsupported task" }, 400);
  }

  const aiResponse = await fetch(completionUrlFromBaseUrl(baseUrl), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      messages: [
        { role: "system", content: systemPrompt(body.task) },
        { role: "user", content: userPrompt(body) },
      ],
    }),
  });

  if (!aiResponse.ok) {
    return jsonResponse({ error: `AI provider failed: ${aiResponse.status}`, detail: await aiResponse.text() }, 502);
  }

  const completion = await aiResponse.json();
  const content = completion?.choices?.[0]?.message?.content || "{}";
  try {
    return jsonResponse(safeParseModelJson(content));
  } catch {
    return jsonResponse({ error: "AI response was not valid JSON", raw: content }, 502);
  }
});
