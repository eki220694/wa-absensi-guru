import { createWorker } from 'tesseract.js';
import fs from 'fs/promises';

export async function verifyPhoto(fotoPath: string, teksDiharapkan: string): Promise<{
  valid: boolean;
  confidence: number;
}> {
  try {
    await fs.access(fotoPath);
  } catch {
    return { valid: false, confidence: 0 };
  }

  const worker = await createWorker('ind');
  const { data } = await worker.recognize(fotoPath);
  await worker.terminate();

  const text = data.text.toLowerCase();
  const expected = teksDiharapkan.toLowerCase();
  const found = text.includes(expected);
  const words = expected.split(/\s+/);
  const matchCount = words.filter(w => text.includes(w)).length;
  const confidence = words.length > 0 ? matchCount / words.length : 0;

  return {
    valid: found || confidence >= 0.6,
    confidence,
  };
}