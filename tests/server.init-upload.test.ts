// tests/server.init-upload.test.ts
// Tests for POST /init-upload with mocked S3 presign helper.

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the S3 upload helper before importing the server.
vi.mock('../src/s3Uploads', () => {
  return {
    createPresignedUploadUrl: vi.fn(async () => ({
      uploadUrl: 'https://example.com/upload',
      objectKey: 'uploads/mock/object.txt',
      expiresInSeconds: 600,
    })),
  };
});

import { createServer } from '../src/server';

describe('POST /init-upload', () => {
  let app: Awaited<ReturnType<typeof createServer>>;

  beforeEach(async () => {
    // Ensure INPUT_BUCKET_NAME is set for tests
    process.env.INPUT_BUCKET_NAME = 'test-bucket';
    app = await createServer();
  });

  it('returns 200 and presign data for valid request', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/init-upload',
      payload: {
        fileName: 'doc.zip',
        contentType: 'application/zip',
      },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as {
      uploadUrl: string;
      objectKey: string;
      expiresInSeconds: number;
      maxSizeBytes: number;
    };

    expect(body.uploadUrl).toBe('https://example.com/upload');
    expect(body.objectKey).toBe('uploads/mock/object.txt');
    expect(body.expiresInSeconds).toBe(600);
    expect(typeof body.maxSizeBytes).toBe('number');
  });

  it('rejects missing fileName or contentType with 400', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/init-upload',
      payload: {
        contentType: 'application/zip',
      },
    } as any);

    expect(response.statusCode).toBe(400);
    const body = response.json() as { errorCode: string };
    expect(body.errorCode).toBe('INVALID_REQUEST');
  });

  it('rejects requests exceeding expectedSizeBytes limit', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/init-upload',
      payload: {
        fileName: 'big.zip',
        contentType: 'application/zip',
        expectedSizeBytes: 1024 * 1024 * 1024, // > S3_OBJECT_MAX_BYTES
      },
    });

    expect(response.statusCode).toBe(400);
    const body = response.json() as { errorCode: string };
    expect(body.errorCode).toBe('INVALID_REQUEST');
  });
});
