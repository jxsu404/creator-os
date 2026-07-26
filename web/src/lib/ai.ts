import { GoogleGenerativeAI } from "@google/generative-ai";

export function getGeminiModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.includes("tu-clave")) {
    throw new Error(
      "Falta GEMINI_API_KEY. Consíguela en https://aistudio.google.com/apikey y ponla en web/.env.local"
    );
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  // gemini-2.0-flash suele tener free-tier limit: 0 en muchas cuentas; 2.5-flash es el default gratis actual
  const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  return genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.8,
      responseMimeType: "application/json",
    },
  });
}

export async function generateJson(prompt: string): Promise<string> {
  try {
    const model = getGeminiModel();
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    if (!text?.trim()) {
      throw new Error("La IA no devolvió contenido. Intenta de nuevo.");
    }
    return text.trim();
  } catch (err) {
    throw new Error(friendlyAiError(err));
  }
}

function friendlyAiError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  if (raw.includes("limit: 0") || raw.includes("Quota exceeded") || raw.includes("429")) {
    return [
      "Gemini rechazó la petición por cuota (429).",
      "Prueba: 1) en .env.local usa GEMINI_MODEL=gemini-2.5-flash",
      "2) revisa límites en AI Studio → tu API key → Rate limits",
      "3) si el free tier sigue en 0, crea un proyecto nuevo en aistudio.google.com o usa otra cuenta Google.",
      "(Algunas cuentas con keys AQ. tienen free tier bloqueado en 0 para ciertos modelos.)",
    ].join(" ");
  }
  if (raw.includes("API_KEY_INVALID") || raw.includes("400") && raw.includes("key")) {
    return "GEMINI_API_KEY inválida. Genera otra en https://aistudio.google.com/apikey";
  }
  return raw;
}

/** Extrae JSON si el modelo envuelve en ```json ... ``` */
export function parseJsonLoose<T>(raw: string): T {
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  return JSON.parse(cleaned) as T;
}
