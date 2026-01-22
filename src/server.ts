// src/server.ts - Fastify HTTP API for Obsidian LaTeX PDF service
// This service exposes JSON, multipart and S3-based rendering endpoints.

import Fastify, { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import multipart from '@fastify/multipart';
import { S3Client, HeadObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import jwt from 'jsonwebtoken';
import { renderDocument, DocumentFormat, RenderOutputFormat, RenderOptions } from './renderer';
import { createPresignedUploadUrl } from './s3Uploads';

// --- Types -----------------------------------------------------------------

interface ErrorResponse {
  errorCode: string;
  message: string;
  details?: unknown;
}

interface RenderJsonRequestBody {
  content: string;
  format: DocumentFormat;
  output: RenderOutputFormat;
  options?: RenderOptions;
}

interface RenderUploadMetadata {
  format: DocumentFormat;
  output: RenderOutputFormat;
  options?: RenderOptions;
}

interface InitUploadRequestBody {
  fileName: string;
  contentType: string;
  expectedSizeBytes?: number;
}

interface InitUploadResponseBody {
  uploadUrl: string;
  objectKey: string;
  expiresInSeconds: number;
  maxSizeBytes: number;
  bucket: string;
}

interface RenderFromS3RequestBody {
  bucket: string;
  key: string;
  format: DocumentFormat;
  output: RenderOutputFormat;
  options?: RenderOptions;
}

// --- Config ----------------------------------------------------------------

const JSON_MAX_BYTES = Number(process.env.JSON_MAX_BYTES ?? 1048576); // 1 MB
const MULTIPART_MAX_BYTES = Number(process.env.MULTIPART_MAX_BYTES ?? 10485760); // 10 MB
const S3_OBJECT_MAX_BYTES = Number(process.env.S3_OBJECT_MAX_BYTES ?? 104857600); // 100 MB
const DEFAULT_LATEX_ENGINE = process.env.LATEX_ENGINE || 'xelatex';
const JWT_SECRET = process.env.JWT_SECRET;

const s3Client = new S3Client({
  region: process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION ?? 'eu-west-1',
});

// --- Utility functions -----------------------------------------------------

function sendError(reply: FastifyReply, statusCode: number, errorCode: string, message: string, details?: unknown) {
  const payload: ErrorResponse = { errorCode, message, details };
  reply.code(statusCode).send(payload);
}

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

function trimText(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + '\n... [truncated]';
}

function buildRenderErrorDetails(err: any, context: Record<string, unknown>): unknown {
  const details: Record<string, unknown> = {
    ...context,
  };

  if (err && typeof err.message === 'string') {
    details.message = err.message;
  }

  const stdout = (err && (err.stdout ?? err.stdOut)) as unknown;
  const stderr = (err && (err.stderr ?? err.stdErr)) as unknown;

  if (typeof stdout === 'string' && stdout.trim().length > 0) {
    details.stdout = trimText(stdout, 2000);
  }
  if (Buffer.isBuffer(stdout) && stdout.length > 0) {
    details.stdout = trimText(stdout.toString('utf8'), 2000);
  }

  if (typeof stderr === 'string' && stderr.trim().length > 0) {
    details.stderr = trimText(stderr, 2000);
  }
  if (Buffer.isBuffer(stderr) && stderr.length > 0) {
    details.stderr = trimText(stderr.toString('utf8'), 2000);
  }

  return details;
}

function handleRenderError(reply: FastifyReply, err: any, context: Record<string, unknown>): void {
  const details = buildRenderErrorDetails(err, context);
  sendError(reply, 500, 'RENDER_ERROR', 'Rendering failed', details);
}

function verifyJwtFromHeader(request: FastifyRequest, reply: FastifyReply): boolean {
  // If no secret is configured, treat the API as public.
  if (!JWT_SECRET) {
    return true;
  }

  const header = request.headers['authorization'];
  if (!header || !header.toString().startsWith('Bearer ')) {
    sendError(reply, 401, 'UNAUTHORIZED', 'Missing Authorization header');
    return false;
  }

  const token = header.toString().slice('Bearer '.length);
  try {
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch {
    sendError(reply, 401, 'UNAUTHORIZED', 'Invalid or expired token');
    return false;
  }
}

// --- Server factory --------------------------------------------------------

export async function createServer(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: true,
    bodyLimit: MULTIPART_MAX_BYTES,
  });

  await app.register(multipart);

  // Health check endpoints for load balancers and smoke tests
  const healthHandler = async () => ({
    status: 'ok',
    service: 'obsidian-latex-pdf',
    version: process.env.npm_package_version ?? 'unknown',
  });

  app.get('/health', healthHandler);
  app.get('/', healthHandler);

  // Self-test endpoint that attempts a tiny render via the same pipeline used
  // by normal requests. This is heavier than /health and intended for
  // diagnostics only.
  app.get('/self-test-render', async (request, reply) => {
    if (!verifyJwtFromHeader(request, reply)) return;

    try {
      const buffer = await renderDocument(
        Buffer.from('# Self-test\\n\\nThis is a self-test document.', 'utf8'),
        'markdown',
        'pdf',
        {},
      );

      // We discard the actual PDF bytes, but report size and basic info.
      reply.send({
        status: 'ok',
        service: 'obsidian-latex-pdf',
        test: 'render',
        outputBytes: buffer.length,
      });
    } catch (err: any) {
      request.log.error({ err }, 'self-test-render failed');
      return handleRenderError(reply, err, { endpoint: 'self-test-render' });
    }
  });

  // JSON endpoint
  app.post('/render-json', async (request: FastifyRequest<{ Body: RenderJsonRequestBody }>, reply: FastifyReply) => {
    if (!verifyJwtFromHeader(request, reply)) return;

    const { content, format, output, options } = request.body;

    const rawLength = Buffer.byteLength(JSON.stringify(request.body), 'utf8');
    if (rawLength > JSON_MAX_BYTES) {
      return sendError(reply, 400, 'INVALID_REQUEST', 'JSON body exceeds maximum allowed size for this endpoint');
    }

    if (!['markdown', 'latex'].includes(format)) {
      return sendError(reply, 400, 'INVALID_REQUEST', 'Unsupported format');
    }

    if (!['pdf', 'latex'].includes(output)) {
      return sendError(reply, 400, 'INVALID_REQUEST', 'Unsupported output');
    }

    try {
      const buffer = await renderDocument(Buffer.from(content, 'utf8'), format, output, options);
      const contentType = output === 'pdf' ? 'application/pdf' : 'application/x-latex';
      reply.header('Content-Type', contentType).send(buffer);
    } catch (err: any) {
      request.log.error({ err }, 'render-json failed');
      return handleRenderError(reply, err, { endpoint: 'render-json' });
    }
  });

  // Multipart endpoint
  app.post('/render-upload', async (request: FastifyRequest, reply: FastifyReply) => {
    if (!verifyJwtFromHeader(request, reply)) return;

    const parts = request.parts();
    let filePart: any;
    let metadataPart: RenderUploadMetadata | undefined;

    for await (const part of parts) {
      if (part.type === 'file' && part.fieldname === 'file') {
        filePart = part;
      } else if (part.type === 'field' && part.fieldname === 'metadata') {
        try {
          metadataPart = JSON.parse(part.value) as RenderUploadMetadata;
        } catch {
          return sendError(reply, 400, 'INVALID_REQUEST', 'metadata must be valid JSON');
        }
      }
    }

    if (!filePart) {
      return sendError(reply, 400, 'INVALID_REQUEST', 'file part is required');
    }

    const chunks: Buffer[] = [];
    for await (const chunk of filePart.file) {
      chunks.push(chunk);
    }
    const fileBuffer = Buffer.concat(chunks);

    if (fileBuffer.byteLength > MULTIPART_MAX_BYTES) {
      return sendError(reply, 413, 'PAYLOAD_TOO_LARGE', 'Uploaded file exceeds multipart limit');
    }

    const meta = metadataPart ?? { format: 'markdown', output: 'pdf' };

    try {
      const buffer = await renderDocument(fileBuffer, meta.format, meta.output, meta.options);
      const contentType = meta.output === 'pdf' ? 'application/pdf' : 'application/x-latex';
      reply.header('Content-Type', contentType).send(buffer);
    } catch (err: any) {
      request.log.error({ err }, 'render-upload failed');
      return handleRenderError(reply, err, { endpoint: 'render-upload' });
    }
  });

  // init-upload endpoint
  app.post('/init-upload', async (request: FastifyRequest<{ Body: InitUploadRequestBody }>, reply: FastifyReply) => {
    if (!verifyJwtFromHeader(request, reply)) return;

    const { fileName, contentType, expectedSizeBytes } = request.body;

    if (!fileName || !contentType) {
      return sendError(reply, 400, 'INVALID_REQUEST', 'fileName and contentType are required');
    }

    if (expectedSizeBytes && expectedSizeBytes > S3_OBJECT_MAX_BYTES) {
      return sendError(reply, 400, 'INVALID_REQUEST', 'expectedSizeBytes exceeds allowed limit');
    }

    const bucket = process.env.INPUT_BUCKET_NAME;
    if (!bucket) {
      return sendError(reply, 500, 'CONFIG_ERROR', 'INPUT_BUCKET_NAME environment variable is not set');
    }

    try {
      const { uploadUrl, objectKey, expiresInSeconds } = await createPresignedUploadUrl({
        bucket,
        fileName,
        contentType,
      });

      const maxSizeBytes = S3_OBJECT_MAX_BYTES;

      const response: InitUploadResponseBody = {
        uploadUrl,
        objectKey,
        expiresInSeconds,
        maxSizeBytes,
        bucket,
      };

      reply.send(response);
    } catch (err: any) {
      request.log.error({ err }, 'init-upload presign failed');
      return sendError(reply, 500, 'INTERNAL_ERROR', 'Failed to generate upload URL');
    }
  });

  // render-from-s3 endpoint (uses S3 client but can be smoke-tested independently)
  app.post(
    '/render-from-s3',
    async (request: FastifyRequest<{ Body: RenderFromS3RequestBody }>, reply: FastifyReply) => {
      if (!verifyJwtFromHeader(request, reply)) return;

      const { bucket, key, format, output, options } = request.body;

      if (!bucket || !key) {
        return sendError(reply, 400, 'INVALID_REQUEST', 'bucket and key are required');
      }

      if (!['markdown', 'latex'].includes(format)) {
        return sendError(reply, 400, 'INVALID_REQUEST', 'Unsupported format');
      }

      if (!['pdf', 'latex'].includes(output)) {
        return sendError(reply, 400, 'INVALID_REQUEST', 'Unsupported output');
      }

      try {
        const head = await s3Client.send(
          new HeadObjectCommand({
            Bucket: bucket,
            Key: key,
          })
        );

        const contentLength = head.ContentLength ?? 0;
        if (contentLength === 0) {
          return sendError(reply, 404, 'OBJECT_NOT_FOUND', 'S3 object is empty or missing');
        }

        if (contentLength > S3_OBJECT_MAX_BYTES) {
          return sendError(
            reply,
            413,
            'PAYLOAD_TOO_LARGE',
            `S3 object size ${contentLength} exceeds allowed limit ${S3_OBJECT_MAX_BYTES}`
          );
        }

        const getResp = await s3Client.send(
          new GetObjectCommand({
            Bucket: bucket,
            Key: key,
          })
        );

        const body = getResp.Body;
        if (!body) {
          return sendError(reply, 404, 'OBJECT_NOT_FOUND', 'S3 object has no body');
        }

        let objectBuffer: Buffer;
        if (body instanceof Readable) {
          objectBuffer = await streamToBuffer(body);
        } else if (body instanceof Uint8Array) {
          objectBuffer = Buffer.from(body);
        } else {
          const maybeStream = body as unknown as Readable;
          if (typeof (maybeStream as any)[Symbol.asyncIterator] === 'function') {
            objectBuffer = await streamToBuffer(maybeStream);
          } else {
            return sendError(reply, 500, 'INTERNAL_ERROR', 'Unsupported S3 body type');
          }
        }

        try {
          const buffer = await renderDocument(objectBuffer, format, output, options);
          const contentType = output === 'pdf' ? 'application/pdf' : 'application/x-latex';
          reply.header('Content-Type', contentType).send(buffer);
        } catch (err: any) {
          request.log.error({ err, bucket, key }, 'render-from-s3 render failed');
          return handleRenderError(reply, err, { endpoint: 'render-from-s3', bucket, key });
        }
      } catch (err: any) {
        request.log.error({ err, bucket, key }, 'render-from-s3 failed');
        const code = err?.name || err?.Code;
        if (code === 'NoSuchKey' || code === 'NotFound') {
          return sendError(reply, 404, 'OBJECT_NOT_FOUND', 'S3 object not found');
        }
        return sendError(reply, 500, 'INTERNAL_ERROR', 'Unexpected error while rendering from S3');
      }
    }
  );

  return app;
}

// Standalone entrypoint for Docker image
if (require.main === module) {
  createServer()
    .then((app) => app.listen({ port: Number(process.env.PORT ?? 8080), host: '0.0.0.0' }))
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error(err);
      process.exit(1);
    });
}
