import { requestApproval } from "../src/core/approval";
import { generateText } from "../src/core/generate-text";
import { createGoogle } from "../src/providers/google";
import { readFile } from "../src/tools/readFile";
import { writeFile } from "../src/tools/writeFile";
import type { Message, Tool } from "../src/types";

const MAX_STEPS = 20; // 最大ステップ数

const tools = [readFile, writeFile];
const google = createGoogle();
const model = google("gemini-3.5-flash");

// 5.4節のexecuteToolを拡張（エラーハンドリング追加）
async function executeTool(tool: Tool, args: any): Promise<string> {
  try {
    return await tool.execute(args);
  } catch (error) {
    // 例外をキャッチし、エラーメッセージを返す（例外をスローしない）
    return `エラー: ${(error as Error).message}`;
  }
}

async function generate(userMessage: string): Promise<string> {
  const messages: Message[] = [
    { role: "system", content: "あなたはファイル操作ができるアシスタントです。" },
    { role: "user", content: userMessage },
  ];

  let stepCount = 0;
  let finalText = "";
  while (stepCount < MAX_STEPS) {
    stepCount++;

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

  if (stepCount >= MAX_STEPS) {
    console.warn("警告: 最大ステップ数に達しました");
  }

  return finalText;
}

generate("README.mdのタイトルを大文字にして");
