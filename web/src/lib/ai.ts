import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  clearCooldown,
  cooldownMsFromError,
  getCooldown,
  isInCooldown,
  setCooldown,
  statusFromCooldown,
  type AiProviderStatus,
} from "@/lib/ai-cooldowns";

type AiProvider = {
  id: string;
  label: string;
  name: string;
  run: (prompt: string) => Promise<string>;
};

/**
 * Genera JSON con failover silencioso:
 * Gemini → Grok (xAI) → Groq. Respeta cooldowns de cuota.
 * Solo lanza error si fallan todos los disponibles.
 */
export async function generateJson(prompt: string): Promise<string> {
  const all = buildProviders();
  if (all.length === 0) {
    throw new Error(
      "No hay ningún proveedor de IA configurado. Añade GEMINI_API_KEY, XAI_API_KEY y/o GROQ_API_KEY en .env.local (local) o en Vercel → Environment Variables (producción)."
    );
  }

  const ready = all.filter((p) => !isInCooldown(p.id));
  if (ready.length === 0) {
    const soonest = all
      .map((p) => getCooldown(p.id))
      .filter(Boolean)
      .sort(
        (a, b) =>
          new Date(a!.until).getTime() - new Date(b!.until).getTime()
      )[0];
    const waitMs = soonest
      ? Math.max(0, new Date(soonest.until).getTime() - Date.now())
      : 60_000;
    const waitLabel =
      waitMs > 60_000
        ? `${Math.ceil(waitMs / 60_000)} min`
        : `${Math.max(1, Math.ceil(waitMs / 1000))}s`;
    throw new Error(
      `Capacidad del plan recargando. Prueba de nuevo en ~${waitLabel} (Perfil → Tu plan).`
    );
  }

  const failures: string[] = [];

  for (const provider of ready) {
    try {
      const text = await provider.run(prompt);
      if (!text?.trim()) throw new Error("Respuesta vacía");
      clearCooldown(provider.id);
      return text.trim();
    } catch (err) {
      markCooldownFromError(provider, err);
      const detail = friendlyProviderError(err);
      console.warn(`[ai] ${provider.name} falló → siguiente:`, detail);
      failures.push(`${provider.name}: ${detail}`);
    }
  }

  throw new Error(
    [
      "Ningún proveedor de IA pudo responder.",
      ...failures.map((f) => `• ${f}`),
      "Revisa tu plan en Perfil, o las keys en .env.local.",
    ].join("\n")
  );
}

/** Estado de proveedores para la UI de Perfil. */
export function getAiProvidersStatus(): AiProviderStatus[] {
  const statuses: AiProviderStatus[] = [];
  const keys = geminiKeys();

  if (keys.length === 0) {
    statuses.push(
      statusFromCooldown("gemini", "Gemini", false, null)
    );
  } else {
    keys.forEach((key, index) => {
      const id = `gemini:${maskKey(key)}`;
      const label =
        keys.length === 1 ? "Gemini" : `Gemini ${index + 1}`;
      statuses.push(
        statusFromCooldown(id, label, true, getCooldown(id))
      );
    });
  }

  const xai = process.env.XAI_API_KEY?.trim();
  const grokConfigured = Boolean(xai && !xai.includes("tu-clave"));
  statuses.push(
    statusFromCooldown("grok", "Grok (xAI)", grokConfigured, getCooldown("grok"))
  );

  const groq = process.env.GROQ_API_KEY?.trim();
  const groqConfigured = Boolean(groq && !groq.includes("tu-clave"));
  statuses.push(
    statusFromCooldown("groq", "Groq", groqConfigured, getCooldown("groq"))
  );

  return statuses;
}

function markCooldownFromError(provider: AiProvider, err: unknown): void {
  const parsed = cooldownMsFromError(err);
  if (!parsed) return;
  setCooldown({
    id: provider.id,
    label: provider.label,
    until: new Date(Date.now() + parsed.ms).toISOString(),
    reason: parsed.reason,
    detail: parsed.detail,
  });
}

function buildProviders(): AiProvider[] {
  const providers: AiProvider[] = [];

  geminiKeys().forEach((key, index, arr) => {
    const id = `gemini:${maskKey(key)}`;
    const label = arr.length === 1 ? "Gemini" : `Gemini ${index + 1}`;
    providers.push({
      id,
      label,
      name: `${label}(${maskKey(key)})`,
      run: (prompt) => runGemini(key, prompt),
    });
  });

  const xai = process.env.XAI_API_KEY?.trim();
  if (xai && !xai.includes("tu-clave")) {
    providers.push({
      id: "grok",
      label: "Grok (xAI)",
      name: "Grok",
      run: (prompt) =>
        runOpenAiCompat({
          apiKey: xai,
          url: "https://api.x.ai/v1/chat/completions",
          model: process.env.XAI_MODEL || "grok-3-mini",
          providerName: "Grok",
        })(prompt),
    });
  }

  const groq = process.env.GROQ_API_KEY?.trim();
  if (groq && !groq.includes("tu-clave")) {
    providers.push({
      id: "groq",
      label: "Groq",
      name: "Groq",
      run: (prompt) =>
        runOpenAiCompat({
          apiKey: groq,
          url: "https://api.groq.com/openai/v1/chat/completions",
          model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
          providerName: "Groq",
        })(prompt),
    });
  }

  return providers;
}

function geminiKeys(): string[] {
  const keys: string[] = [];
  const primary = process.env.GEMINI_API_KEY?.trim();
  if (primary && !primary.includes("tu-clave")) keys.push(primary);

  for (let i = 2; i <= 5; i++) {
    const k = process.env[`GEMINI_API_KEY_${i}`]?.trim();
    if (k && !k.includes("tu-clave")) keys.push(k);
  }

  const list = process.env.GEMINI_API_KEYS?.trim();
  if (list) {
    for (const part of list.split(",")) {
      const k = part.trim();
      if (k && !k.includes("tu-clave")) keys.push(k);
    }
  }

  return [...new Set(keys)];
}

async function runGemini(apiKey: string, prompt: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.8,
      responseMimeType: "application/json",
    },
  });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

/** Grok (xAI) y Groq comparten formato OpenAI chat completions. */
function runOpenAiCompat(opts: {
  apiKey: string;
  url: string;
  model: string;
  providerName: string;
}) {
  return async (prompt: string): Promise<string> => {
    const res = await fetch(opts.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${opts.apiKey}`,
      },
      body: JSON.stringify({
        model: opts.model,
        temperature: 0.8,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Respondes SOLO con JSON válido, sin markdown ni texto fuera del JSON.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    const raw = await res.text();
    if (!res.ok) {
      const retryAfter = res.headers.get("retry-after");
      const suffix = retryAfter ? ` retry-after=${retryAfter}` : "";
      throw new Error(`HTTP ${res.status}: ${raw.slice(0, 280)}${suffix}`);
    }

    let parsed: {
      choices?: Array<{ message?: { content?: string } }>;
    };
    try {
      parsed = JSON.parse(raw) as typeof parsed;
    } catch {
      throw new Error(`Respuesta ${opts.providerName} no es JSON de chat`);
    }

    const content = parsed.choices?.[0]?.message?.content;
    if (!content?.trim()) {
      throw new Error(`${opts.providerName} no devolvió contenido`);
    }
    return content.trim();
  };
}

function maskKey(key: string): string {
  if (key.length <= 8) return "****";
  return `${key.slice(0, 4)}…${key.slice(-4)}`;
}

function friendlyProviderError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  const parsed = cooldownMsFromError(err);
  if (parsed) return parsed.detail;

  if (raw.includes("404")) {
    return "modelo no encontrado — revisa GEMINI_MODEL / XAI_MODEL / GROQ_MODEL";
  }
  if (raw.includes("403")) return "acceso denegado (403)";

  const short = raw.replace(/\s+/g, " ").trim();
  return short.length > 160 ? `${short.slice(0, 157)}…` : short;
}

/**
 * Genera una imagen (miniatura) con failover:
 * Grok Imagine (xAI) → Gemini Imagen.
 * Devuelve un data URL (image/jpeg o image/png).
 */
export async function generateImage(prompt: string): Promise<string> {
  const providers = buildImageProviders();
  if (providers.length === 0) {
    throw new Error(
      "No hay proveedor de imagen configurado. Añade XAI_API_KEY (Grok Imagine) o GEMINI_API_KEY (Imagen) en .env.local / Vercel."
    );
  }

  const ready = providers.filter((p) => !isInCooldown(p.id));
  if (ready.length === 0) {
    throw new Error(
      "Capacidad de imagen recargando. Prueba de nuevo en un momento (Perfil → Uso de IA)."
    );
  }

  const failures: string[] = [];
  for (const provider of ready) {
    try {
      const dataUrl = await provider.run(prompt);
      if (!dataUrl?.startsWith("data:image/")) {
        throw new Error("Respuesta de imagen inválida");
      }
      clearCooldown(provider.id);
      return dataUrl;
    } catch (err) {
      markCooldownFromError(provider, err);
      const detail = friendlyProviderError(err);
      console.warn(`[ai:image] ${provider.name} falló → siguiente:`, detail);
      failures.push(`${provider.name}: ${detail}`);
    }
  }

  throw new Error(
    [
      "Ningún proveedor pudo generar la miniatura.",
      ...failures.map((f) => `• ${f}`),
      "Revisa las keys de imagen en .env.local / Vercel.",
    ].join("\n")
  );
}

type ImageProvider = {
  id: string;
  label: string;
  name: string;
  run: (prompt: string) => Promise<string>;
};

function buildImageProviders(): ImageProvider[] {
  const providers: ImageProvider[] = [];

  const xai = process.env.XAI_API_KEY?.trim();
  if (xai && !xai.includes("tu-clave")) {
    providers.push({
      id: "grok",
      label: "Grok Imagine",
      name: "Grok Imagine",
      run: (prompt) => runXaiImage(xai, prompt),
    });
  }

  geminiKeys().forEach((key, index, arr) => {
    const id = `gemini:${maskKey(key)}`;
    const label = arr.length === 1 ? "Gemini Imagen" : `Gemini Imagen ${index + 1}`;
    providers.push({
      id,
      label,
      name: `${label}(${maskKey(key)})`,
      run: (prompt) => runGeminiImagen(key, prompt),
    });
  });

  return providers;
}

async function runXaiImage(apiKey: string, prompt: string): Promise<string> {
  const model = process.env.XAI_IMAGE_MODEL || "grok-2-image";
  const res = await fetch("https://api.x.ai/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      prompt,
      n: 1,
      response_format: "b64_json",
    }),
  });
  const raw = await res.text();
  if (!res.ok) {
    const retryAfter = res.headers.get("retry-after");
    const suffix = retryAfter ? ` retry-after=${retryAfter}` : "";
    throw new Error(`HTTP ${res.status}: ${raw.slice(0, 280)}${suffix}`);
  }
  let parsed: {
    data?: Array<{ b64_json?: string; url?: string }>;
  };
  try {
    parsed = JSON.parse(raw) as typeof parsed;
  } catch {
    throw new Error("Respuesta Grok Imagine no es JSON");
  }
  const b64 = parsed.data?.[0]?.b64_json?.trim();
  if (b64) return `data:image/jpeg;base64,${b64}`;
  const url = parsed.data?.[0]?.url?.trim();
  if (url) return await fetchImageAsDataUrl(url);
  throw new Error("Grok Imagine no devolvió imagen");
}

async function runGeminiImagen(apiKey: string, prompt: string): Promise<string> {
  const model =
    process.env.GEMINI_IMAGE_MODEL || "imagen-3.0-generate-002";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      instances: [{ prompt }],
      parameters: {
        sampleCount: 1,
        aspectRatio: "16:9",
      },
    }),
  });
  const raw = await res.text();
  if (!res.ok) {
    const retryAfter = res.headers.get("retry-after");
    const suffix = retryAfter ? ` retry-after=${retryAfter}` : "";
    throw new Error(`HTTP ${res.status}: ${raw.slice(0, 280)}${suffix}`);
  }
  let parsed: {
    predictions?: Array<{ bytesBase64Encoded?: string; mimeType?: string }>;
  };
  try {
    parsed = JSON.parse(raw) as typeof parsed;
  } catch {
    throw new Error("Respuesta Gemini Imagen no es JSON");
  }
  const pred = parsed.predictions?.[0];
  const b64 = pred?.bytesBase64Encoded?.trim();
  if (!b64) throw new Error("Gemini Imagen no devolvió bytes");
  const mime = pred?.mimeType?.trim() || "image/png";
  return `data:${mime};base64,${b64}`;
}

async function fetchImageAsDataUrl(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`No pude descargar la imagen (${res.status})`);
  const buf = Buffer.from(await res.arrayBuffer());
  const mime = res.headers.get("content-type") || "image/jpeg";
  return `data:${mime};base64,${buf.toString("base64")}`;
}

export function parseJsonLoose<T>(raw: string): T {
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  return JSON.parse(cleaned) as T;
}
