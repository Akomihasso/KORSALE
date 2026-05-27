import { PrismaClient, UserRole, GorusmeTipi, GorusmeSonuc } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seed başlıyor...");

  const passHash = await bcrypt.hash("KorsaleDev2026!", 12);

  const yonetici = await prisma.user.upsert({
    where: { email: "dunyada.sonyediyil@kordinat.com.tr" },
    update: {},
    create: {
      email: "dunyada.sonyediyil@kordinat.com.tr",
      name: "Yönetici",
      role: UserRole.YONETICI,
      passwordHash: passHash,
    },
  });

  const satis1 = await prisma.user.upsert({
    where: { email: "satis1@kordinat.com" },
    update: {},
    create: {
      email: "satis1@kordinat.com",
      name: "Ayşe Demir",
      role: UserRole.SATIS,
      passwordHash: passHash,
    },
  });

  await prisma.user.upsert({
    where: { email: "satis2@kordinat.com" },
    update: {},
    create: {
      email: "satis2@kordinat.com",
      name: "Mehmet Yılmaz",
      role: UserRole.SATIS,
      passwordHash: passHash,
    },
  });

  await prisma.user.upsert({
    where: { email: "operasyon@kordinat.com" },
    update: {},
    create: {
      email: "operasyon@kordinat.com",
      name: "Zeynep Kaya",
      role: UserRole.OPERASYON,
      passwordHash: passHash,
    },
  });

  // Firmalar
  const firma1 = await prisma.firma.upsert({
    where: { marksoftId: "DEMO-001" },
    update: {},
    create: {
      ad: "Atlas Tekstil A.Ş.",
      marksoftId: "DEMO-001",
      sektor: "Tekstil",
      sehir: "İstanbul",
      telefon: "+90 212 555 0001",
      email: "info@atlastekstil.com.tr",
      kaynak: "Referans",
      kisiler: {
        create: [
          {
            ad: "Ali Vural",
            unvan: "Genel Müdür",
            telefon: "+90 532 111 0001",
            email: "ali.vural@atlastekstil.com.tr",
            birincil: true,
          },
        ],
      },
    },
  });

  const firma2 = await prisma.firma.upsert({
    where: { marksoftId: "DEMO-002" },
    update: {},
    create: {
      ad: "Mavi Yazılım Ltd.",
      marksoftId: "DEMO-002",
      sektor: "Yazılım",
      sehir: "Ankara",
      telefon: "+90 312 555 0002",
      email: "bilgi@maviyazilim.com",
      kaynak: "Web",
      kisiler: {
        create: [
          {
            ad: "Selin Aktaş",
            unvan: "Pazarlama Direktörü",
            email: "selin@maviyazilim.com",
            birincil: true,
          },
        ],
      },
    },
  });

  await prisma.firma.upsert({
    where: { marksoftId: "DEMO-003" },
    update: {},
    create: {
      ad: "Ege Gıda Sanayi",
      marksoftId: "DEMO-003",
      sektor: "Gıda",
      sehir: "İzmir",
      telefon: "+90 232 555 0003",
      kaynak: "Fuar",
    },
  });

  // Funnel demoluğu için: ikinci firma için bir görüşme + onaylanmış teklif
  const mevcutGorusme2 = await prisma.gorusme.findFirst({
    where: { firmaId: firma2.id, konu: "Logo tasarımı için marka koruma" },
  });
  if (!mevcutGorusme2) {
    await prisma.gorusme.create({
      data: {
        firmaId: firma2.id,
        sorumluId: satis1.id,
        ilkTemasId: satis1.id,
        tarih: new Date(),
        tip: GorusmeTipi.ONLINE,
        konu: "Logo tasarımı için marka koruma",
        ozet: "Yeni logoyu marka olarak tescil ettirmek istiyorlar.",
        sonuc: GorusmeSonuc.TEKLIF_ISTENDI,
        tahminiTutar: 22000,
      },
    });
  }

  // Bir örnek görüşme
  const mevcutGorusme = await prisma.gorusme.findFirst({
    where: { firmaId: firma1.id, konu: "Marka tescil başvurusu" },
  });
  if (!mevcutGorusme) {
    await prisma.gorusme.create({
      data: {
        firmaId: firma1.id,
        sorumluId: satis1.id,
        ilkTemasId: satis1.id,
        tarih: new Date(),
        tip: GorusmeTipi.TELEFON,
        konu: "Marka tescil başvurusu",
        ozet: "Firma yeni bir marka için tescil başvurusu yapmak istiyor. Teklif istendi.",
        sonuc: GorusmeSonuc.TEKLIF_ISTENDI,
        tahminiTutar: 15000,
      },
    });
  }

  // Varsayılan ayarlar
  const varsayilanAyarlar = [
    { anahtar: "indirim_onay_yuzde", deger: "15" },
    { anahtar: "devir_otomatik_kabul_saat", deger: "24" },
    { anahtar: "devir_geri_alma_saat", deger: "1" },
    { anahtar: "devir_notu_min_karakter", deger: "50" },
    { anahtar: "belge_no_format", deger: "{TIP}-{YIL}-{SIRA:4}" },
    { anahtar: "firma_adi", deger: "Kordinat" },
  ];

  for (const ayar of varsayilanAyarlar) {
    await prisma.ayar.upsert({
      where: { anahtar: ayar.anahtar },
      update: {},
      create: ayar,
    });
  }

  console.log("✅ Seed tamamlandı");
  console.log("");
  console.log("Giriş bilgileri (şifre tüm hesaplar için aynı):");
  console.log("  Yönetici:   dunyada.sonyediyil@kordinat.com.tr");
  console.log("  Satış 1:    satis1@kordinat.com");
  console.log("  Satış 2:    satis2@kordinat.com");
  console.log("  Operasyon:  operasyon@kordinat.com");
  console.log("  Şifre:      KorsaleDev2026!");
  console.log(`  (Yönetici id: ${yonetici.id})`);
  console.log(`  (Demo firma 2 id: ${firma2.id})`);
}

main()
  .catch((e) => {
    console.error("Seed hata:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
