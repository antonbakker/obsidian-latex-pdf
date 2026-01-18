// tests/server.render-json.test.ts
// Basic tests for POST /render-json using Fastify's inject and a mocked renderer.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createServer } from '../src/server';

// Mock the heavy renderer so tests don't require pandoc/LaTeX installed locally.
vi.mock('../src/renderer', () => {
  return {
    renderDocument: vi.fn(async () => Buffer.from('PDF_BYTES')),
    // Types are not needed at runtime; only renderDocument is used in tests.
  };
});

describe('POST /render-json', () => {
  let app: Awaited<ReturnType<typeof createServer>>;

  beforeEach(async () => {
    app = await createServer();
  });

  it('returns 200 and pdf content-type for valid markdown -> pdf request', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/render-json',
      payload: {
        content: '# Hello',
        format: 'markdown',
        output: 'pdf',
        options: { paperSize: 'a4' },
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('application/pdf');
    expect(response.body).toBe('PDF_BYTES');
  });

  it('rejects too-large JSON payloads with 400', async () => {
    // Construct a payload just above the JSON_MAX_BYTES default (1 MB)
    const bigContent = 'x'.repeat(1024 * 1024 + 10);

    const response = await app.inject({
      method: 'POST',
      url: '/render-json',
      payload: {
        content: bigContent,
        format: 'markdown',
        output: 'pdf',
      },
    });

    expect(response.statusCode).toBe(400);
    const body = response.json() as { errorCode: string };
    expect(body.errorCode).toBe('INVALID_REQUEST');
  });

  it('rejects unsupported format/output combinations', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/render-json',
      payload: {
        content: '# Hello',
        format: 'invalid-format',
        output: 'pdf',
      },
    } as any);

    expect(response.statusCode).toBe(400);
    const body = response.json() as { errorCode: string };
    expect(body.errorCode).toBe('INVALID_REQUEST');
  });
});
