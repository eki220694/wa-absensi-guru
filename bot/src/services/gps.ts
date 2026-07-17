import { hitungJarak, SEKOLAH, RADIUS_METER } from '@wa-absensi/shared';

export function verifyLocation(lat: number, lng: number) {
  const jarak = hitungJarak(lat, lng, SEKOLAH.latitude, SEKOLAH.longitude);
  return {
    jarak: Math.round(jarak * 100) / 100,
    diLuarRadius: jarak > RADIUS_METER,
  };
}