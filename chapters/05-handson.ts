import { generateText } from "../src/core/generate-text";
import { createGoogle } from "../src/providers/google";
import { readFile } from "../src/tools/readFile";
import { writeFile } from "../src/tools/writeFile";
import type { Message, Tool } from "../src/types";

const tools = [readFile, writeFile];
const google = createGoogle();
const model = google('gemini-3.5-flash');

async function executeTool(tool: Tool, args: any): Promise<string> {
  return await tool.execute(args);
}

async function generate(userMessage: string): Promise<string> {
  const messages: Message[] = [
    { role: "system", content: "あなたはファイル操作ができるアシスタントです。" },
    { role: "user", content: userMessage },
  ];

  let finalText = "";
  while (true) {
    // ステップ1: LLMを呼び出す
    const response = await generateText({ model, messages, tools });
    if (response.text) {
      finalText = response.text;
      console.log(response.text);
    }

    // ステップ2: ツール呼び出しがあればassistantメッセージ追加
    if (response.toolCalls && response.toolCalls.length > 0) {
      messages.push({
        role: "assistant",
        content: response.text || "",
        toolCalls: response.toolCalls,
      });
      for (const toolCall of response.toolCalls) {
        console.log(`[ツール実行] ${toolCall.name}`);
        // ステップ3: ツールを検索して実行

        const tool = tools.find((t) => t.name === toolCall.name);
        if (!tool) {
          throw new Error(`Unknown tool: ${toolCall.name}`);
        }
        const result = await executeTool(tool, toolCall.args);

        // ステップ4: toolメッセージを会話履歴に追加
        messages.push({
          role: "tool",
          toolCallId: toolCall.toolCallId, // ここでtoolCallIdを紐付け
          name: toolCall.name, // ツール名も必須
          content: result,
        });
      }
      continue;
    }
    messages.push({
      role: "assistant",
      content: response.text,
    });
    if (response.finishReason === "stop") {
      break;
    }
  }
  return finalText;
}

generate("README.mdの内容を教えて");