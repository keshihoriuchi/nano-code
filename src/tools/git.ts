import type { Tool } from "../types";
import { execCommand } from "./execCommand";

// ブランチ名の検証（引数インジェクション対策）
function validateBranchName(name: string): void {
  if (name.startsWith("-") || name.startsWith(":")) {
    throw new Error("無効なブランチ名形式です");
  }
}

async function createBranchExecute(args: { branchName: string }): Promise<string> {
  validateBranchName(args.branchName);
  // -B オプション: ブランチが存在すればリセット、なければ新規作成
  const result = await execCommand.execute({
    command: `git checkout -B ${args.branchName}`,
  });
  return `ブランチを作成しました: ${args.branchName}\n${result}`;
}

async function commitExecute(args: { message: string; files: string[] }): Promise<string> {
  // 変更があるか確認（空コミット防止）
  const status = await execCommand.execute({
    command: "git status --porcelain",
  });
  if (!status.trim()) {
    return "コミットする変更がありません";
  }
  for (const file of args.files) {
    await execCommand.execute({ command: `git add "${file}"` });
  }
  const result = await execCommand.execute({
    command: `git commit -m "${args.message}"`,
  });

  return `コミットしました: ${args.message}\n${result}`;
}

async function pushBranchExecute(args: { branchName: string }): Promise<string> {
  validateBranchName(args.branchName);
  const result = await execCommand.execute({
    command: `git push -u origin ${args.branchName}`,
  });
  return `ブランチをプッシュしました: ${args.branchName}\n${result}`;
}

export const createBranch: Tool = {
  name: "createBranch",
  description: "新しいGitブランチを作成。既存ブランチがある場合は強制リセット",
  parameters: {
    type: "object",
    properties: {
      branchName: {
        type: "string",
        description: "作成するブランチ名",
      },
    },
    required: ["branchName"],
  },
  needsApproval: true,
  execute: createBranchExecute as (args: Record<string, unknown>) => Promise<string>,
};

export const commit: Tool = {
  name: "commitChanges",
  description: "指定したファイルをステージしてコミットする",
  parameters: {
    type: "object",
    properties: {
      message: {
        type: "string",
        description: "コミットメッセージ",
      },
      files: {
        type: "array",
        items: { type: "string" },
        description: "コミットに含めるファイルのパス一覧",
      },
    },
    required: ["message", "files"],
  },
  needsApproval: true,
  execute: commitExecute as (args: Record<string, unknown>) => Promise<string>,
};

export const pushBranch: Tool = {
  name: "pushBranch",
  description: "ブランチをリモート(origin)にプッシュ",
  parameters: {
    type: "object",
    properties: {
      branchName: {
        type: "string",
        description: "プッシュするブランチ名",
      },
    },
    required: ["branchName"],
  },
  needsApproval: true,
  execute: pushBranchExecute as (args: Record<string, unknown>) => Promise<string>,
};
