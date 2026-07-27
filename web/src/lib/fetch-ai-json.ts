export async function safeAiJson(res: Response): Promise<unknown> {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("No pude conectar. Intenta de nuevo.");
  }
}

export function aiResponseError(data: unknown): string {
  if (data && typeof data === "object" && "error" in data) {
    return String((data as { error?: unknown }).error) || "Error";
  }
  return "Error";
}
