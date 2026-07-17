export const SEKOLAH = {
  nama: 'SMAN 6 SIGI',
  // TODO: update koordinat asli SMAN 6 SIGI
  latitude: -1.1234,
  longitude: 121.1234,
} as const;

export const RADIUS_METER = 100;
export const JAM_SENIN_KAMIS = { mulai: '07:00', selesai: '14:00' };
export const JAM_JUMAT = { mulai: '07:00', selesai: '11:00' };
export const HARI = ['', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'] as const;
export const JENIS_IZIN = ['izin', 'sakit', 'cuti', 'dinas_luar'] as const;
export const STATUS_ABSEN = ['hadir', 'terlambat', 'tidak_hadir'] as const;
export const STATUS_IZIN = ['pending', 'disetujui', 'ditolak'] as const;
