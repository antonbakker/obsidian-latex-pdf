import { App, Notice, TFile, requestUrl } from "obsidian";
import type { TemplateDefinition } from "./templateRegistry";
import { runPandocToPdf, PandocRunnerSettings } from "./pandocRunner";
import * as fs from "fs/promises";
import * as path from "path";

export interface ExportSettings extends PandocRunnerSettings {}

export interface ServiceExportSettings {
  baseUrl: string;
  jwtToken?: string;
}

/**
 * Runs pandoc to export the given note to a PDF using the selected template.
 */
export async function exportNoteToPdf(
  app: App,
  file: TFile,
  template: TemplateDefinition,
  settings: ExportSettings,
): Promise<void> {
  try {
    const outputPath = await runPandocToPdf({
      app,
      file,
      template,
      settings,
    });
    new Notice(`LaTeX PDF exported: ${outputPath}`);
  } catch (error: any) {
    console.error("Pandoc export failed", error);
    new Notice("LaTeX PDF export failed. Check console for details.");
  }
}

/**
 * Export the given note via the remote HTTP service.
 *
 * This sends the raw markdown content to the /render-json endpoint and writes
 * the returned PDF next to the note in the vault.
 */
export async function exportNoteViaService(
  app: App,
  file: TFile,
  template: TemplateDefinition, // currently unused, reserved for future template-aware HTTP API
  settings: ServiceExportSettings,
): Promise<void> {
  const baseUrl = (settings.baseUrl || "").trim();
  if (!baseUrl) {
    new Notice("Remote service base URL is not configured. Set it in the LaTeX PDF settings.");
    return;
  }

  try {
    const content = await app.vault.read(file);
    const encoder = new TextEncoder();
    const utf8 = encoder.encode(content);
    const sizeBytes = utf8.length;
    const JSON_THRESHOLD = 1024 * 1024; // 1 MB

    const base = baseUrl.replace(/\/+$/, "");

    const headers: Record<string, string> = {};
    if (settings.jwtToken) {
      headers["Authorization"] = `Bearer ${settings.jwtToken}`;
    }

    let pdfBuffer: Buffer;

    if (sizeBytes <= JSON_THRESHOLD) {
      // Small/medium notes: send directly via /render-json
      const url = `${base}/render-json`;

      const response = await requestUrl({
        url,
        method: "POST",
        body: JSON.stringify({
          content,
          format: "markdown",
          output: "pdf",
          options: { templateId: template.id },
        }),
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
      });

      const arrayBuffer = response.arrayBuffer;
      pdfBuffer = Buffer.from(arrayBuffer);
    } else {
      // Large notes: use S3 flow via /init-upload + /render-from-s3
      const initUrl = `${base}/init-upload`;

      const initResp = await requestUrl({
        url: initUrl,
        method: "POST",
        body: JSON.stringify({
          fileName: `${file.basename}.md`,
          contentType: "text/markdown; charset=utf-8",
          expectedSizeBytes: sizeBytes,
        }),
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
      });

      const initBody = initResp.json as unknown as {
        uploadUrl: string;
        objectKey: string;
        bucket: string;
      };

      // Upload raw markdown to S3 using the presigned URL.
      await requestUrl({
        url: initBody.uploadUrl,
        method: "PUT",
        body: content,
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
        },
      });

      // Trigger rendering from S3.
      const renderUrl = `${base}/render-from-s3`;
      const renderResp = await requestUrl({
        url: renderUrl,
        method: "POST",
        body: JSON.stringify({
          bucket: initBody.bucket,
          key: initBody.objectKey,
          format: "markdown",
          output: "pdf",
          options: { templateId: template.id },
        }),
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
      });

      const renderArrayBuffer = renderResp.arrayBuffer;
      pdfBuffer = Buffer.from(renderArrayBuffer);
    }

    const notePath = file.path; // e.g. "folder/note.md"
    const noteDir = notePath.includes("/")
      ? notePath.substring(0, notePath.lastIndexOf("/"))
      : "";
    const noteBase = file.basename;
    const vaultBasePath = (app.vault as any).adapter?.basePath as string | undefined;
    if (!vaultBasePath) {
      new Notice("Cannot resolve vault base path to write PDF.");
      return;
    }

    const outputDir = noteDir ? path.join(vaultBasePath, noteDir) : vaultBasePath;
    const outputPath = path.join(outputDir, `${noteBase}.pdf`);

    await fs.writeFile(outputPath, pdfBuffer);

    new Notice(`Remote LaTeX PDF exported: ${outputPath}`);
  } catch (error: any) {
    console.error("Remote export failed", error);

    const message = (error && error.message) || "";
    if (typeof message === "string") {
      // DNS / name resolution failures (Electron/Chromium and Node-style messages).
      if (
        message.includes("ERR_NAME_NOT_RESOLVED") ||
        message.includes("ENOTFOUND")
      ) {
        new Notice(
          "Remote LaTeX PDF export failed: the service hostname could not be resolved. Check 'Remote service base URL' in the plugin settings and your DNS configuration.",
        );
        return;
      }

      // Connection refused / no listener on the target host:port.
      if (message.includes("ECONNREFUSED")) {
        new Notice(
          "Remote LaTeX PDF export failed: the connection was refused. Ensure the remote service is deployed, running, and reachable from this device.",
        );
        return;
      }

      // Common TLS / certificate issues.
      if (
        message.includes("CERT_") ||
        message.toLowerCase().includes("ssl") ||
        message.toLowerCase().includes("tls")
      ) {
        new Notice(
          "Remote LaTeX PDF export failed due to an HTTPS/SSL error. Verify the remote service certificate and that the base URL matches the certificate's hostname.",
        );
        return;
      }
    }

    new Notice("Remote LaTeX PDF export failed. Check console for details.");
  }
}
