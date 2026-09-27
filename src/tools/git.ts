import type { Tool } from "../types";
import { execCommand } from "./execCommand";

// ブランチ名の検証（引数インジェクション対策）
function validateBranchName(name: string): void {
  if (name.startsWith("-") || name.startsWith(":")) {
    throw new Error("無効なブランチ名形式です");
  }
}

export const createBranch: Tool = {
  name: "createBranch",
  description: "新しいGitブランチを作成。既存ブランチがある場合は強制リセット",
  needsApproval: true,
  execute: (async (args: { branchName: string }) => {
    validateBranchName(args.branchName);
    // -B オプション: ブランチが存在すればリセット、なければ新規作成
    const result = await execCommand.execute({
      command: `git checkout -B ${args.branchName}`,
    });
    return `ブランチを作成しました: ${args.branchName}\n${result}`;
  }) as (args: Record<string, unknown>) => Promise<string>,
};

export const commit = {
  name: "commitChanges",
  description: "変更をコミット",
  execute: async (args: { message: string; files: string[] }) => {
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
  },
};

export const pushBranch = {
  name: "pushBranch",
  description: "ブランチをリモートにプッシュ",
  execute: async (args: { branchName: string }) => {
    validateBranchName(args.branchName);
    const result = await execCommand.execute({
      command: `git push -u origin ${args.branchName}`,
    });
    return `ブランチをプッシュしました: ${args.branchName}\n${result}`;
  },
};
