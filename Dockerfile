# Dockerfile for obsidian-latex-pdf HTTP API service

# === Stage 1: build server bundle ===
FROM node:20-bookworm-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

# Copy templates
COPY templates/article/template.tex /templates/article.tex
COPY templates/business-plan/template.tex /templates/business-plan.tex
COPY templates/common/template.tex /templates/common.tex
COPY templates/ieee-proposal/template.tex /templates/ieee-proposal.tex
COPY templates/kaobook/template.tex /templates/kaobook.tex
COPY templates/koma-proposal/template.tex /templates/koma-proposal.tex
COPY templates/letter/template.tex /templates/letter.tex
COPY templates/memo/template.tex /templates/memo.tex
COPY templates/report/template.tex /templates/report.tex
COPY templates/thesis-kaobook/template.tex /templates/thesis-kaobook.tex

# Build server bundle (uses esbuild via package.json script)
RUN npm run build:server

# === Stage 2: runtime with Pandoc + LaTeX ===
FROM node:20-bookworm-slim AS runtime

WORKDIR /app

# Install system dependencies: pandoc + LaTeX
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    pandoc \
    texlive-latex-base \
    texlive-latex-recommended \
    texlive-latex-extra \
    texlive-fonts-recommended \
    texlive-xetex \
  && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN useradd -m appuser
USER appuser

COPY --chown=appuser:appuser package*.json ./
COPY --from=builder --chown=appuser:appuser /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:appuser /app/server.js ./server.js

ENV NODE_ENV=production \
    PORT=8080 \
    JSON_MAX_BYTES=1048576 \
    MULTIPART_MAX_BYTES=10485760 \
    S3_OBJECT_MAX_BYTES=104857600 \
    LATEX_ENGINE=xelatex

EXPOSE 8080

CMD ["node", "server.js"]
