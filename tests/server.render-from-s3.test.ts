// tests/server.render-from-s3.test.ts
// Tests for POST /render-from-s3 using mocked S3 client and renderer.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Readable } from 'stream';

// Mock AWS S3 client before importing the server.
const headMock = vi.fn();
const getMock = vi.fn();

vi.mock('@aws-sdk/client-s3', () => {
  return {
    S3Client: vi.fn().mockImplementation(() => ({
      send: async (command: any) => {
        if (command.__type === 'HeadObjectCommand') return headMock();
        if (command.__type === 'GetObjectCommand') return getMock();
        throw new Error('Unexpected command');
      },
    })),
    HeadObjectCommand: vi.fn((input) => ({ __type: 'HeadObjectCommand', input })),
    GetObjectCommand: vi.fn((input) => ({ __type: 'GetObjectCommand', input })),
  };
});

// Mock renderer to avoid calling pandoc/LaTeX.
vi.mock('../src/renderer', () => ({
  renderDocument: vi.fn(async () => Buffer.from('PDF_FROM_S3')),
}));

import { createServer } from '../src/server';

describe('POST /render-from-s3', () => {
  let app: Awaited<ReturnType<typeof createServer>>;

  // Disable auth for tests so endpoint behaves as a public API
  beforeEach(() => {
    delete process.env.JWT_SECRET;
    delete process.env.API_TOKEN;
  });

  beforeEach(async () => {
    headMock.mockReset();
    getMock.mockReset();
    app = await createServer();
  });

  it('returns 200 and pdf content-type for valid S3 object', async () => {
    headMock.mockResolvedValue({ ContentLength: 10 });
    getMock.mockResolvedValue({ Body: Readable.from(['dummy']) });

    const response = await app.inject({
      method: 'POST',
      url: '/render-from-s3',
      payload: {
        bucket: 'bucket',
        key: 'key',
        format: 'markdown',
        output: 'pdf',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('application/pdf');
    expect(response.body).toBe('PDF_FROM_S3');
  });

  it('returns 404 when S3 reports object not found', async () => {
    headMock.mockImplementation(async () => {
      const err: any = new Error('Not found');
      err.name = 'NoSuchKey';
      throw err;
    });

    const response = await app.inject({
      method: 'POST',
      url: '/render-from-s3',
      payload: {
        bucket: 'bucket',
        key: 'missing',
        format: 'markdown',
        output: 'pdf',
      },
    });

    expect(response.statusCode).toBe(404);
    const body = response.json() as { errorCode: string };
    expect(body.errorCode).toBe('OBJECT_NOT_FOUND');
  });
});
