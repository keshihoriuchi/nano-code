# セキュアで最小限のBun開発環境
# 非rootユーザー / 権限制限 / プロジェクトディレクトリのみ
FROM oven/bun:1.3

# 必須ツールのみ（git、curl、sudo、ps用のprocps）
RUN apt-get update && apt-get install -y --no-install-recommends \
    procps \
    git \
    curl \
    ca-certificates \
    sudo \
 && apt-get clean && rm -rf /var/lib/apt/lists/*

# Node.js（LTS）をインストール (oxcのLanguage Server起動に必要)
RUN curl -fsSL https://deb.nodesource.com/setup_24.x | bash - \
 && apt-get install -y --no-install-recommends nodejs \
 && apt-get clean && rm -rf /var/lib/apt/lists/*

# GitHub CLI (gh) をインストール
RUN curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg -o /usr/share/keyrings/githubcli-archive-keyring.gpg \
 && chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg \
 && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" > /etc/apt/sources.list.d/github-cli.list \
 && apt-get update && apt-get install -y --no-install-recommends gh \
 && apt-get clean && rm -rf /var/lib/apt/lists/*

# 非rootユーザーを作成（ベースイメージの bun ユーザー(UID 1000)をリネームし、ホストのUIDと一致させる）
RUN groupmod -n vscode bun \
 && usermod -l vscode -d /home/vscode -m -s /bin/bash bun
RUN usermod -aG sudo vscode \
    && echo "vscode ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/vscode \
    && chmod 0440 /etc/sudoers.d/vscode
USER vscode
WORKDIR /nano-code

# 基本環境変数
ENV DEVCONTAINER=true
ENV PATH="/home/vscode/.bun/bin:$PATH"

# Bunのキャッシュをユーザーごとに分離
ENV BUN_INSTALL_CACHE_DIR=/home/vscode/.bun-cache
RUN mkdir -p $BUN_INSTALL_CACHE_DIR
CMD ["bash"]