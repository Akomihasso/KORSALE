export type Aralik = "HAFTA" | "AY" | "TUMU";

export const ARALIK_ETIKET: Record<Aralik, string> = {
  HAFTA: "Bu hafta",
  AY: "Bu ay",
  TUMU: "Tümü",
};

export const ARALIK_LISTE: Aralik[] = ["HAFTA", "AY", "TUMU"];

export function haftaBasi(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const gun = d.getDay();
  const farkPazartesi = (gun + 6) % 7; // Pazartesi=0
  d.setDate(d.getDate() - farkPazartesi);
  return d;
}

export function ayBasi(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function aralikBaslangic(aralik: Aralik): Date | null {
  if (aralik === "HAFTA") return haftaBasi();
  if (aralik === "AY") return ayBasi();
  return null;
}

export function normalizeAralik(v: string | undefined, varsayilan: Aralik = "AY"): Aralik {
  if (v === "HAFTA" || v === "AY" || v === "TUMU") return v;
  return varsayilan;
}
