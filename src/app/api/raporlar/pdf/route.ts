import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { createElement } from "react";

import { requireAuth } from "@/lib/auth-helpers";
import { raporUret, type RaporTipi } from "@/lib/raporlar";

const GECERLI_TIPLER: RaporTipi[] = ["gorusme", "teklif", "operasyon", "ekip"];

const styles = StyleSheet.create({
  page: { padding: 28, fontSize: 8, fontFamily: "Helvetica" },
  header: { marginBottom: 12 },
  title: { fontSize: 16, fontWeight: 700, marginBottom: 4 },
  meta: { fontSize: 9, color: "#666" },
  table: { width: "100%" },
  row: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#ddd" },
  rowHead: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    borderBottomWidth: 1,
    borderBottomColor: "#999",
  },
  cell: { padding: 4, flex: 1, fontSize: 7 },
  cellHead: { padding: 4, flex: 1, fontWeight: 700, fontSize: 7 },
  ozet: { marginTop: 10, fontSize: 9 },
});

function PdfBelge({
  baslik,
  donem,
  sutunlar,
  satirlar,
  ozet,
}: {
  baslik: string;
  donem: string;
  sutunlar: string[];
  satirlar: string[][];
  ozet?: { etiket: string; deger: string }[];
}) {
  return createElement(
    Document,
    null,
    createElement(
      Page,
      { size: "A4", orientation: "landscape", style: styles.page },
      createElement(
        View,
        { style: styles.header },
        createElement(Text, { style: styles.title }, baslik),
        createElement(Text, { style: styles.meta }, `Dönem: ${donem}`),
        createElement(
          Text,
          { style: styles.meta },
          `${satirlar.length} kayıt · Oluşturulma: ${new Date().toLocaleString("tr-TR")}`,
        ),
      ),
      createElement(
        View,
        { style: styles.table },
        createElement(
          View,
          { style: styles.rowHead },
          ...sutunlar.map((s, i) =>
            createElement(Text, { key: `h${i}`, style: styles.cellHead }, s),
          ),
        ),
        ...satirlar.map((sat, i) =>
          createElement(
            View,
            { key: `r${i}`, style: styles.row, wrap: false },
            ...sat.map((h, j) =>
              createElement(Text, { key: `c${i}-${j}`, style: styles.cell }, h),
            ),
          ),
        ),
      ),
      ozet && ozet.length > 0
        ? createElement(
            View,
            { style: styles.ozet },
            ...ozet.map((o, i) =>
              createElement(Text, { key: `o${i}` }, `${o.etiket}: ${o.deger}`),
            ),
          )
        : null,
    ),
  );
}

export async function GET(req: NextRequest) {
  await requireAuth();
  const { searchParams } = new URL(req.url);
  const tipRaw = searchParams.get("tip");
  const baslangicRaw = searchParams.get("baslangic");
  const bitisRaw = searchParams.get("bitis");

  if (!tipRaw || !GECERLI_TIPLER.includes(tipRaw as RaporTipi)) {
    return new NextResponse("Geçersiz rapor tipi", { status: 400 });
  }
  const baslangic = baslangicRaw ? new Date(baslangicRaw) : null;
  const bitis = bitisRaw ? new Date(bitisRaw) : null;
  if (!baslangic || !bitis || isNaN(baslangic.getTime()) || isNaN(bitis.getTime())) {
    return new NextResponse("Geçersiz tarih", { status: 400 });
  }

  const rapor = await raporUret(tipRaw as RaporTipi, baslangic, bitis);
  const buffer = await renderToBuffer(
    PdfBelge({
      baslik: rapor.baslik,
      donem: rapor.donem,
      sutunlar: rapor.sutunlar,
      satirlar: rapor.satirlar,
      ozet: rapor.ozet,
    }),
  );

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="rapor-${tipRaw}-${baslangicRaw}.pdf"`,
    },
  });
}
