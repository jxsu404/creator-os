import OpenAI from "openai";

export function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Falta OPENAI_API_KEY. Crea web/.env.local con tu clave para generar enfoques y borradores."
    );
  }
  return new OpenAI({
    apiKey,
    baseURL: process.env.OPENAI_BASE_URL || undefined,
  });
}

export function getModel() {
  return process.env.OPENAI_MODEL || "gpt-4o-mini";
}
