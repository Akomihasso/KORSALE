import { NextRequest, NextResponse } from "next/server";
import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

import { requireAuth } from "@/lib/auth-helpers";
import { raporUret, type RaporTipi } from "@/lib/raporlar";

const GECERLI_TIPLER: RaporTipi[] = ["gorusme", "teklif", "operasyon", "ekip"];

function hucre(metin: string, baslik = false): TableCell {
  return new TableCell({
    children: [
      new Paragraph({
        children: [new TextRun({ text: metin, bold: baslik, size: 16 })],
      }),
    ],
  });
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

  const baslikRow = new TableRow({
    tableHeader: true,
    children: rapor.sutunlar.map((s) => hucre(s, true)),
  });
  const veriSatirlari = rapor.satirlar.map(
    (sat) =>
      new TableRow({
        children: sat.map((h) => hucre(h)),
      }),
  );

  const tablo = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [baslikRow, ...veriSatirlari],
  });

  const ozetParagraf = rapor.ozet
    ? rapor.ozet.map(
        (o) =>
          new Paragraph({
            spacing: { before: 100 },
            children: [
              new TextRun({ text: `${o.etiket}: `, bold: true }),
              new TextRun(o.deger),
            ],
          }),
      )
    : [];

  const dosya = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { orientation: "landscape" },
            margin: { top: 720, right: 720, bottom: 720, left: 720 },
          },
        },
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.LEFT,
            children: [new TextRun(rapor.baslik)],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "Dönem: ", bold: true }),
              new TextRun(rapor.donem),
            ],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: `${rapor.satirlar.length} kayıt · Oluşturulma: ${new Date().toLocaleString("tr-TR")}`,
                size: 18,
                color: "666666",
              }),
            ],
          }),
          tablo,
          ...ozetParagraf,
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(dosya);

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="rapor-${tipRaw}-${baslangicRaw}.docx"`,
    },
  });
}
