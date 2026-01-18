// src/renderer.ts - Shared pandoc/LaTeX rendering pipeline for HTTP API

import { execFile } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';

export type DocumentFormat = 'markdown' | 'latex';
export type RenderOutputFormat = 'pdf' | 'latex';

export interface RenderOptions {
  paperSize?: string;
  margin?: string;
  templateId?: string;
}

const execFileAsync = promisify(execFile);

const DEFAULT_LATEX_ENGINE = process.env.LATEX_ENGINE || 'xelatex';

async function runCommand(cmd: string, args: string[], cwd: string): Promise<{ stdout: string; stderr: string }> {
  const { stdout, stderr } = await execFileAsync(cmd, args, {
    cwd,
    env: process.env,
    maxBuffer: 10 * 1024 * 1024, // 10 MB for logs
  });
  return { stdout: stdout.toString(), stderr: stderr.toString() };
}

async function withTempDir<T>(fn: (dir: string) => Promise<T>): Promise<T> {
  const base = os.tmpdir();
  const dir = await fs.mkdtemp(path.join(base, 'obsidian-latex-pdf-'));
  try {
    return await fn(dir);
  } finally {
    await fs.rm(dir, { recursive: true, force: true }).catch(() => undefined);
  }
}

export async function renderDocument(
  source: Buffer,
  format: DocumentFormat,
  output: RenderOutputFormat,
  options?: RenderOptions
): Promise<Buffer> {
  return withTempDir(async (workDir) => {
    const inputExt = format === 'markdown' ? '.md' : '.tex';
    const inputName = `input${inputExt}`;
    const inputPath = path.join(workDir, inputName);

    await fs.writeFile(inputPath, source);

    if (format === 'markdown' && output === 'pdf') {
      return renderMarkdownToPdf(inputPath, workDir, options);
    }

    if (format === 'markdown' && output === 'latex') {
      return renderMarkdownToLatex(inputPath, workDir, options);
    }

    if (format === 'latex' && output === 'pdf') {
      return renderLatexToPdf(inputPath, workDir);
    }

    if (format === 'latex' && output === 'latex') {
      return source;
    }

    throw new Error(`Unsupported combination: format=${format}, output=${output}`);
  });
}

async function renderMarkdownToPdf(
  inputPath: string,
  workDir: string,
  options?: RenderOptions
): Promise<Buffer> {
  const outputPath = path.join(workDir, 'output.pdf');

  const args: string[] = [
    inputPath,
    '-o',
    outputPath,
    '--pdf-engine',
    DEFAULT_LATEX_ENGINE,
  ];

  if (options?.paperSize) {
    args.push('-V', `papersize:${options.paperSize}`);
  }

  if (options?.margin) {
    args.push('-V', `margin=${options.margin}`);
  }

  await runCommand('pandoc', args, workDir);
  return fs.readFile(outputPath);
}

async function renderMarkdownToLatex(
  inputPath: string,
  workDir: string,
  options?: RenderOptions
): Promise<Buffer> {
  const outputPath = path.join(workDir, 'output.tex');

  const args: string[] = [
    inputPath,
    '-o',
    outputPath,
    '--to=latex',
  ];

  if (options?.templateId) {
    // Example hook: map templateId to a LaTeX template path inside the container.
    // const templatePath = `/templates/${options.templateId}.tex`;
    // args.push('--template', templatePath);
  }

  await runCommand('pandoc', args, workDir);
  return fs.readFile(outputPath);
}

async function renderLatexToPdf(
  inputPath: string,
  workDir: string
): Promise<Buffer> {
  const inputFileName = path.basename(inputPath);

  const args: string[] = [
    '-interaction=nonstopmode',
    '-halt-on-error',
    inputFileName,
  ];

  await runCommand(DEFAULT_LATEX_ENGINE, args, workDir);

  const pdfPath = path.join(workDir, inputFileName.replace(/\.tex$/i, '.pdf'));
  return fs.readFile(pdfPath);
}
