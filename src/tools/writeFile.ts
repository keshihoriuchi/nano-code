// src/tools/writeFile.ts
import * as fs from "fs/promises";
import * as path from "path";

const WORKSPACE_ROOT = path.resolve(process.cwd(), "./workspace");

// 存在する最も深い祖先の実パスに、未作成の残りのパスを結合して返す。
// 宛先が存在しないシンボリックリンク（ダングリング）の場合は null を返す。
async function resolveExistingRealPath(target: string): Promise<string | null> {
  const rest: string[] = [];
  let current = target;
  while (true) {
    try {
      return path.join(await fs.realpath(current), ...rest);
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
    }
    try {
      if ((await fs.lstat(current)).isSymbolicLink()) return null;
    } catch {}
    const parent = path.dirname(current);
    if (parent === current) return null;
    rest.unshift(path.basename(current));
    current = parent;
  }
}

async function writeFileExecute(args: { path: string; content: string }): Promise<string> {
  // ステップ1: 相対パスを絶対パスに変換
  const absolutePath = path.resolve(WORKSPACE_ROOT, args.path);

  // ステップ2: ワークスペース内かチェック（ディレクトリトラバーサル対策）
  const allowedPrefix = WORKSPACE_ROOT + path.sep;
  if (!absolutePath.startsWith(allowedPrefix) && absolutePath !== WORKSPACE_ROOT) {
    throw new Error(`アクセス拒否: ${args.path} はワークスペース外です`);
  }

  // ステップ2.5: シンボリックリンクを解決した実パスがワークスペース内かチェック
  await fs.mkdir(WORKSPACE_ROOT, { recursive: true });
  const realRoot = await fs.realpath(WORKSPACE_ROOT);
  const realTarget = await resolveExistingRealPath(absolutePath);
  if (realTarget === null || (!realTarget.startsWith(realRoot + path.sep) && realTarget !== realRoot)) {
    throw new Error(`アクセス拒否: ${args.path} はワークスペース外です`);
  }

  // ステップ3: ディレクトリの作成（存在しない場合）
  const dir = path.dirname(absolutePath);
  await fs.mkdir(dir, { recursive: true });

  // ステップ4: ファイルの書き込み
  await fs.writeFile(absolutePath, args.content, "utf-8");
  return `ファイルを書き込みました: ${args.path}`;
}

export const writeFile = {
  name: "writeFile",
  description:
    "指定されたパスにファイルを作成または上書きする。ディレクトリが存在しない場合は自動的に作成される。",
  parameters: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "書き込むファイルのパス",
      },
      content: {
        type: "string",
        description: "ファイルに書き込む内容",
      },
    },
    required: ["path", "content"],
  },
  execute: writeFileExecute,
};
