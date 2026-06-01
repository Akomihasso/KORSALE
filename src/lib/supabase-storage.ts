import { createClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase Storage client.
 *
 * Service role key kullanılır — bypass RLS, asla client'a expose edilmemeli.
 * Sadece server actions ve API route'larda kullanın.
 *
 * Beklenen env değişkenleri:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *
 * Lokal geliştirme için env yoksa kullanım hata fırlatır.
 */

export const KORSISTEM_BUCKET = "korsistem";

let _client: ReturnType<typeof createClient> | null = null;

function getClient() {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Supabase Storage yapılandırılmamış. .env'e NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY ekleyin.",
    );
  }
  _client = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return _client;
}

function temizDosyaAdi(ad: string): string {
  return ad
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // diakritik
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 120);
}

export async function dokumanYukle(
  dosya: File,
  kategori: string,
): Promise<{ url: string; path: string }> {
  const supabase = getClient();
  const ad = temizDosyaAdi(dosya.name);
  const path = `${kategori.toLowerCase()}/${Date.now()}-${ad}`;
  const buffer = Buffer.from(await dosya.arrayBuffer());

  const { data, error } = await supabase.storage
    .from(KORSISTEM_BUCKET)
    .upload(path, buffer, {
      contentType: dosya.type || "application/octet-stream",
      upsert: false,
    });
  if (error) throw new Error(`Yükleme hatası: ${error.message}`);

  const { data: urlData } = supabase.storage
    .from(KORSISTEM_BUCKET)
    .getPublicUrl(data.path);

  return { url: urlData.publicUrl, path: data.path };
}

export async function dokumanSil(path: string): Promise<void> {
  const supabase = getClient();
  const { error } = await supabase.storage.from(KORSISTEM_BUCKET).remove([path]);
  if (error) throw new Error(`Silme hatası: ${error.message}`);
}

/**
 * Public URL'den storage path'ini çıkar.
 * .../storage/v1/object/public/korsistem/<path> → <path>
 */
export function urldenPath(url: string): string | null {
  const m = url.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
  return m ? m[1] : null;
}
