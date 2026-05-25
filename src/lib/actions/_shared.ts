import { z } from "zod";

export type ActionState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

/**
 * FormData'yı Zod şemasıyla doğrular.
 * Boolean alanlar için "on"/"true" string'leri otomatik dönüştürülür.
 * Boş string'ler optional alanlar için undefined'a çevrilir.
 */
export function parseFormData<T extends z.ZodTypeAny>(
  schema: T,
  formData: FormData,
  options?: { booleanFields?: string[] },
): { data?: z.infer<T>; state?: ActionState } {
  const raw: Record<string, unknown> = {};

  for (const [key, value] of formData.entries()) {
    if (options?.booleanFields?.includes(key)) {
      raw[key] = value === "on" || value === "true";
    } else if (typeof value === "string") {
      raw[key] = value === "" ? undefined : value;
    } else {
      raw[key] = value;
    }
  }

  // Form boolean alanlarında "off" durumu hiç gelmez — varsayılan false olarak set et
  if (options?.booleanFields) {
    for (const key of options.booleanFields) {
      if (!(key in raw)) raw[key] = false;
    }
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".") || "_";
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return {
      state: {
        ok: false,
        error: "Form bilgilerini kontrol edin",
        fieldErrors,
      },
    };
  }

  return { data: parsed.data };
}

export const okState: ActionState = { ok: true };
