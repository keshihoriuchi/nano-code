import { requestApproval } from "../src/core/approval";
import { generateText } from "../src/core/generate-text";
import { createGoogle } from "../src/providers/google";
import { readFile } from "../src/tools/readFile";
import { writeFile } from "../src/tools/writeFile";
import type { Message, Tool } from "../src/types";

const tools = [readFile, writeFile];
const google = createGoogle();
const model = google("gemini-3.5-flash");

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
        // ステップ3: ツールを検索して実行
        const tool = tools.find((t) => t.name === toolCall.name);
        if (!tool) {
          throw new Error(`Unknown tool: ${toolCall.name}`);
        }
        console.log(`[ツール実行] ${toolCall.name}`);

        // 承認が必要かチェック
        if (tool.needsApproval) {
          const approved = await requestApproval(toolCall.name, toolCall.args);
          if (!approved) {
            // ユーザーが拒否した場合、自然言語でLLMに通知
            messages.push({
              role: "tool",
              toolCallId: toolCall.toolCallId,
              name: toolCall.name,
              content: "ユーザーによってキャンセルされました。別の方法を検討してください。",
            });
            continue;
          }
        }

        // 承認された、または承認不要な場合は実行
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

generate('README.mdのタイトルを大文字にして');
