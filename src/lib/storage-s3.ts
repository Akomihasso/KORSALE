import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

const BUCKET = process.env.S3_BUCKET ?? "korsistem";

let _client: S3Client | null = null;

function getClient(): S3Client {
  if (_client) return _client;
  const endpoint = process.env.S3_ENDPOINT;
  const accessKeyId = process.env.S3_ACCESS_KEY;
  const secretAccessKey = process.env.S3_SECRET_KEY;
  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "S3 storage yapılandırılmamış. .env'e S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY ekleyin.",
    );
  }
  _client = new S3Client({
    region: process.env.S3_REGION ?? "us-east-1",
    endpoint,
    forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey },
  });
  return _client;
}

function temizDosyaAdi(ad: string): string {
  return ad
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 120);
}

function publicUrl(key: string): string {
  const base = process.env.S3_PUBLIC_URL;
  if (base) return `${base.replace(/\/$/, "")}/${BUCKET}/${key}`;
  const endpoint = (process.env.S3_ENDPOINT ?? "").replace(/\/$/, "");
  return `${endpoint}/${BUCKET}/${key}`;
}

export async function dokumanYukle(
  dosya: File,
  kategori: string,
): Promise<{ url: string; path: string }> {
  const client = getClient();
  const ad = temizDosyaAdi(dosya.name);
  const key = `${kategori.toLowerCase()}/${Date.now()}-${ad}`;
  const body = Buffer.from(await dosya.arrayBuffer());

  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: dosya.type || "application/octet-stream",
    }),
  );

  return { url: publicUrl(key), path: key };
}

export async function dokumanSil(path: string): Promise<void> {
  const client = getClient();
  await client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: path }));
}
