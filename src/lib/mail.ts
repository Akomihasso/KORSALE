const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

const SENDER_NAME = "KORSALE";
const SENDER_EMAIL = "bilgi@korsale.tr";

type MailGonderArgs = {
  to: { email: string; name?: string };
  subject: string;
  html: string;
  text?: string;
};

type MailGonderSonuc = { ok: true; messageId: string } | { ok: false; error: string };

export async function mailGonder(args: MailGonderArgs): Promise<MailGonderSonuc> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "BREVO_API_KEY tanımlı değil" };
  }

  try {
    const res = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        sender: { name: SENDER_NAME, email: SENDER_EMAIL },
        to: [args.to],
        subject: args.subject,
        htmlContent: args.html,
        textContent: args.text,
      }),
    });

    if (!res.ok) {
      const detay = await res.text();
      return { ok: false, error: `Brevo ${res.status}: ${detay.slice(0, 200)}` };
    }

    const data = (await res.json()) as { messageId?: string };
    return { ok: true, messageId: data.messageId ?? "" };
  } catch (err) {
    const mesaj = err instanceof Error ? err.message : "Bilinmeyen hata";
    return { ok: false, error: mesaj };
  }
}

type DavetMailiArgs = {
  ad: string;
  email: string;
  gecicSifre: string;
  girisUrl: string;
};

export async function davetMailiGonder(args: DavetMailiArgs) {
  const { ad, email, gecicSifre, girisUrl } = args;

  const html = `
<!DOCTYPE html>
<html lang="tr">
  <body style="margin:0;padding:0;background:#f4f6fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(15,23,42,0.06);">
            <tr>
              <td style="padding:32px 40px 16px;">
                <div style="font-size:13px;letter-spacing:0.12em;color:#475569;font-weight:600;">KORSALE</div>
                <h1 style="margin:12px 0 0;font-size:22px;font-weight:700;color:#0f172a;">Hesabınız oluşturuldu</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 40px 16px;font-size:15px;line-height:1.6;color:#334155;">
                Merhaba ${escapeHtml(ad)},<br /><br />
                KORSALE satış &amp; operasyon paneline ekip üyesi olarak eklendiniz. Aşağıdaki bilgilerle giriş yapabilirsiniz.
              </td>
            </tr>
            <tr>
              <td style="padding:0 40px 16px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
                  <tr>
                    <td style="padding:16px 20px;font-size:14px;color:#475569;">
                      <div style="margin-bottom:8px;"><strong style="color:#0f172a;">E-posta:</strong> ${escapeHtml(email)}</div>
                      <div><strong style="color:#0f172a;">Geçici şifre:</strong> <code style="background:#ffffff;padding:2px 8px;border-radius:6px;border:1px solid #e2e8f0;font-family:'Menlo','Consolas',monospace;">${escapeHtml(gecicSifre)}</code></div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:8px 40px 24px;">
                <a href="${escapeAttr(girisUrl)}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 24px;border-radius:10px;">Panele giriş yap</a>
              </td>
            </tr>
            <tr>
              <td style="padding:0 40px 32px;font-size:13px;line-height:1.6;color:#64748b;">
                Güvenliğiniz için ilk girişten sonra <strong>Profil &gt; Şifre değiştir</strong> bölümünden kendi şifrenizi belirleyin. Bu e-postayı bekleyen yoksanız yöneticinizle iletişime geçin.
              </td>
            </tr>
          </table>
          <div style="font-size:12px;color:#94a3b8;margin-top:16px;">KORSALE · Kordinat Marka Patent</div>
        </td>
      </tr>
    </table>
  </body>
</html>`.trim();

  const text = [
    `Merhaba ${ad},`,
    "",
    "KORSALE paneline ekip üyesi olarak eklendiniz.",
    "",
    `E-posta: ${email}`,
    `Geçici şifre: ${gecicSifre}`,
    "",
    `Panele giriş: ${girisUrl}`,
    "",
    "İlk girişten sonra Profil > Şifre değiştir bölümünden şifrenizi güncelleyin.",
    "",
    "KORSALE · Kordinat Marka Patent",
  ].join("\n");

  return mailGonder({
    to: { email, name: ad },
    subject: "KORSALE paneline davet edildiniz",
    html,
    text,
  });
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(s: string) {
  return escapeHtml(s);
}
