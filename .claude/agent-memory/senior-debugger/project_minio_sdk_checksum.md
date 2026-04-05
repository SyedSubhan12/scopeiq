---
name: MinIO + AWS SDK v3 CRC32 checksum bug
description: AWS SDK v3 >= ~3.600 injects CRC32 checksum query params into presigned URLs; MinIO rejects them with 404
type: project
---

AWS SDK v3 (currently pinned at ^3.1023.0) enables `requestChecksumCalculation: "WHEN_SUPPORTED"` by default, which appends `x-amz-checksum-crc32` and `x-amz-sdk-checksum-algorithm=CRC32` as signed query parameters on `PutObjectCommand` presigned URLs. MinIO does not support these parameters and returns 404 on every presigned PUT.

**Fix applied in `apps/api/src/lib/storage.ts`:**
- Set `requestChecksumCalculation: "WHEN_REQUIRED"` and `responseChecksumValidation: "WHEN_REQUIRED"` on the S3Client constructor.
- Pass `unhoistableHeaders: new Set(["x-amz-checksum-crc32", "x-amz-sdk-checksum-algorithm"])` in the `getSignedUrl` options as a belt-and-suspenders guard.
- Changed `region: "auto"` (Cloudflare R2-only) to `region: "us-east-1"` (MinIO default, avoids signing scope mismatches).

**Why:** MinIO is not AWS S3 — it does not implement the newer S3 Extended Request Checksum protocol. Any SDK upgrade past ~3.600 silently breaks all presigned uploads to MinIO without this configuration.

**How to apply:** If upload 404s reappear after an SDK bump, check the presigned URL query params first. If `x-amz-checksum-*` params are present, re-apply the `WHEN_REQUIRED` flags.
