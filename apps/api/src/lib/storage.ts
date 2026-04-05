import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: "us-east-1",
  endpoint: process.env.STORAGE_USE_SSL === "true"
    ? `https://${process.env.STORAGE_ENDPOINT}:${process.env.STORAGE_PORT}`
    : `http://${process.env.STORAGE_ENDPOINT}:${process.env.STORAGE_PORT}`,
  credentials: {
    accessKeyId: process.env.STORAGE_ACCESS_KEY ?? "",
    secretAccessKey: process.env.STORAGE_SECRET_KEY ?? "",
  },
  forcePathStyle: true,
  // Disable automatic checksum injection introduced in AWS SDK v3 recent releases.
  // MinIO does not support the x-amz-checksum-crc32 / x-amz-sdk-checksum-algorithm
  // query parameters that the SDK bakes into presigned URLs when this is enabled,
  // causing MinIO to return 404 for every presigned PUT.
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});

const bucket = process.env.STORAGE_BUCKET ?? "scopeiq-assets";

/**
 * Ensures the configured bucket exists. Called once at startup so a fresh
 * MinIO volume (empty docker-compose data dir) doesn't silently 404 on the
 * first upload.  Safe to call repeatedly — HeadBucket is a no-op if the
 * bucket already exists.
 */
export async function ensureBucketExists(): Promise<void> {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: bucket }));
  } catch (err: any) {
    // 404 / NoSuchBucket / NotFound all mean the bucket doesn't exist yet.
    const code: string = err?.name ?? err?.Code ?? "";
    if (
      err?.$metadata?.httpStatusCode === 404 ||
      code === "NoSuchBucket" ||
      code === "NotFound" ||
      code === "404"
    ) {
      await s3.send(new CreateBucketCommand({ Bucket: bucket }));
      console.log(`[storage] Created bucket: ${bucket}`);
    } else {
      // Re-throw unexpected errors (bad credentials, network issue, etc.)
      throw err;
    }
  }
}

export async function getUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 3600,
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(s3, command, {
    expiresIn,
    // Prevent the presigner from adding checksum query params to the URL.
    // Without this, SDK v3 >= ~3.600 appends x-amz-checksum-crc32 and
    // x-amz-sdk-checksum-algorithm=CRC32, which MinIO does not recognise
    // and responds with 404.
    unhoistableHeaders: new Set(["x-amz-checksum-crc32", "x-amz-sdk-checksum-algorithm"]),
  });
}

export async function getDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });
  return getSignedUrl(s3, command, { expiresIn });
}
