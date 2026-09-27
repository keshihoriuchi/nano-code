import { spawn } from 'child_process';
import * as path from 'path';
import type { Tool } from '../types';
import { Sandbox } from '../core/sandbox';
import { config } from '../config';
import { parseCommand } from './execCommand';

const WORKSPACE_ROOT = path.resolve(process.cwd(), './workspace');
const ALLOWED_COMMANDS = ['bun', 'ls', 'git', 'gh'];

// 環境変数はホワイトリスト方式（機密情報の漏洩防止）
const SAFE_ENV = {
    PATH: process.env.PATH || '/usr/local/bin:/usr/bin:/bin',
    HOME: '/tmp',
    LANG: process.env.LANG || 'C.UTF-8',
};

async function execCommandSandboxExecute(
    args: Record<string, unknown>
): Promise<string> {
    const command = args.command as string;

    // 第4章の検証ロジック
    const dangerousChars = /[;&`$]/;
    if (dangerousChars.test(command)) {
        throw new Error('シェルメタ文字を含むコマンドは実行できません');
    }
    const parts = parseCommand(command);
    const commandName = parts[0]!;
    const commandArgs = parts.slice(1);
    if (!ALLOWED_COMMANDS.includes(commandName)) {
        throw new Error(`コマンド ${commandName} は許可されていません`);
    }

    // サンドボックス分岐
    if (process.platform === 'linux' && config.sandbox) {
        const sandbox = new Sandbox();
            const result = await sandbox.run(commandName, commandArgs, {
            allowNetwork: false,
            env: SAFE_ENV,
        });
        if (result.exitCode !== 0) {
            throw new Error(`Command failed: ${result.stderr}`);
        }
        return result.stdout;
    }
    // 通常実行（第4章と同じspawnベースの処理）
    return new Promise((resolve, reject) => {
        const child = spawn(commandName, commandArgs, {
            cwd: WORKSPACE_ROOT,
            timeout: 30000,
            shell: false,
        });
        // ... stdout/stderr処理（第4章と同様）
    });
}

export const execCommandSandbox: Tool = {
    name: 'execCommand',
    description: 'ワークスペース内で許可されたコマンドを実行',
    needsApproval: true,
    parameters: {
        type: 'object',
        properties: {
            command: { type: 'string', description: '実行するコマンド' },
        },
        required: ['command'],
    },
    execute: execCommandSandboxExecute,
};