// src/s3Uploads.ts - S3 upload helpers for HTTP API service

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION ?? 'eu-west-1',
});

export interface InitUploadParams {
  bucket: string;
  fileName: string;
  contentType: string;
  expiresInSeconds?: number;
}

export interface InitUploadResult {
  uploadUrl: string;
  objectKey: string;
  expiresInSeconds: number;
}

export async function createPresignedUploadUrl(params: InitUploadParams): Promise<InitUploadResult> {
  const { bucket, fileName, contentType } = params;
  const expiresInSeconds = params.expiresInSeconds ?? 900;

  const datePrefix = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const objectKey = `uploads/${datePrefix}/${Date.now()}-${fileName}`;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: objectKey,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });

  return { uploadUrl, objectKey, expiresInSeconds };
}
