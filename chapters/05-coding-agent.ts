import { Agent } from "../src/core/agent";
import { readFile } from "../src/tools/readFile";
import { writeFile } from "../src/tools/writeFile";
import { editFile } from "../src/tools/editFile";
import { execCommand } from "../src/tools/execCommand";
import { createGoogle } from "../src/providers/google";

// モデルインスタンスを作成
const google = createGoogle();
const model = google("gemini-3.5-flash-lite");
export const codingAgent = new Agent({
  name: "nano-code",
  instructions: "あなたはコーディングエージェントです。慎重に作業してください。",
  model,
  tools: {
    readFile,
    writeFile,
    editFile,
    execCommand,
  },
  maxSteps: 20,
  verbose: true,
});

// 実行
const result = await codingAgent.generate("README.mdのタイトルを大文字にして");
console.log(result.text);
