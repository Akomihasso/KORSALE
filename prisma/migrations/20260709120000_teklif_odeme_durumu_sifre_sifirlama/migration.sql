-- Teklif: ek ödeme durumu (ödeme planı bekleniyor, faturadan sonra ödenecek vb.)
ALTER TABLE "Teklif" ADD COLUMN "odemeDurumu" TEXT;

-- SifreSifirlamaToken: şifremi unuttum akışında üretilen tek kullanımlık token.
CREATE TABLE "SifreSifirlamaToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SifreSifirlamaToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SifreSifirlamaToken_tokenHash_key" ON "SifreSifirlamaToken"("tokenHash");
CREATE INDEX "SifreSifirlamaToken_userId_idx" ON "SifreSifirlamaToken"("userId");
CREATE INDEX "SifreSifirlamaToken_expiresAt_idx" ON "SifreSifirlamaToken"("expiresAt");

ALTER TABLE "SifreSifirlamaToken" ADD CONSTRAINT "SifreSifirlamaToken_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
