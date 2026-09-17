import * as supabaseDriver from "./supabase-storage";

export const KORSISTEM_BUCKET = supabaseDriver.KORSISTEM_BUCKET;

type Driver = "supabase" | "s3";

function driver(): Driver {
  const raw = (process.env.STORAGE_DRIVER ?? "supabase").toLowerCase();
  return raw === "s3" ? "s3" : "supabase";
}

export async function dokumanYukle(
  dosya: File,
  kategori: string,
): Promise<{ url: string; path: string }> {
  if (driver() === "s3") {
    const s3 = await import("./storage-s3");
    return s3.dokumanYukle(dosya, kategori);
  }
  return supabaseDriver.dokumanYukle(dosya, kategori);
}

export async function dokumanSil(path: string): Promise<void> {
  if (driver() === "s3") {
    const s3 = await import("./storage-s3");
    return s3.dokumanSil(path);
  }
  return supabaseDriver.dokumanSil(path);
}

export function urldenPath(url: string): string | null {
  const supa = url.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
  if (supa) return supa[1];
  const bucket = process.env.S3_BUCKET ?? KORSISTEM_BUCKET;
  const marker = `/${bucket}/`;
  const idx = url.lastIndexOf(marker);
  if (idx !== -1) return url.slice(idx + marker.length);
  return null;
}
