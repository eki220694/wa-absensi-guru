export function hitungJarak(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatTanggal(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function hariIni(): number {
  // 1=senin..6=sabtu, 7=minggu
  return new Date().getDay() === 0 ? 7 : new Date().getDay();
}

export function sekarang(): { hari: number; jam: string; jamKe: number } {
  const now = new Date();
  const jam = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
  // Jam ke-1 = 07:00-07:40, jam ke-2 = 07:40-08:20, dst... approximation
  const totalMenit = now.getHours() * 60 + now.getMinutes();
  const jamKe = Math.max(1, Math.min(10, Math.floor((totalMenit - 420) / 40) + 1));
  return { hari: hariIni(), jam, jamKe };
}
