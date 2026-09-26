// Geminiのレスポンスのうち、利用する部分の型
type GeminiResponse = {
  candidates: [
    {
      content: {
        parts: [{ text: string }];
      };
    },
  ];
};

// GeminiのAPIを呼び出す最小限の実装
async function callGemini() {
  const model = "gemini-3.5-flash";
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "x-goog-api-key": process.env.GOOGLE_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "TypeScriptについて簡潔に説明してください。" }] }],
      }),
    },
  );

  const data = (await response.json()) as GeminiResponse;
  console.log(data);
  console.log(data.candidates[0].content.parts[0].text);
}

// 関数を実行
callGemini();
