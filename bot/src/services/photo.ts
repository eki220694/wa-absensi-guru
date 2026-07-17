import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PHOTO_DIR = path.join(__dirname, '../../data/photos');

export async function savePhoto(buffer: Buffer, guruId: number, tanggal: string, jamKe: number): Promise<string> {
  const dir = path.join(PHOTO_DIR, String(guruId));
  await mkdir(dir, { recursive: true });
  const filename = `${tanggal}_${jamKe}.jpg`;
  const filepath = path.join(dir, filename);
  await writeFile(filepath, buffer);
  return filepath;
}