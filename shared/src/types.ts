export interface Guru {
  id: number;
  nip: string;
  nama: string;
  no_wa: string;
  jabatan: 'guru' | 'wali_kelas' | 'admin';
  password_hash?: string;
}

export interface Jadwal {
  id: number;
  guru_id: number;
  hari: number; // 1=senin..6=sabtu
  jam_ke: number;
  jam_mulai: string; // 'HH:MM'
  jam_selesai: string;
  kelas: string;
  mapel: string;
  ruangan: string | null;
  semester: string;
  tahun_ajaran: string;
}

export interface Absen {
  id: number;
  guru_id: number;
  jadwal_id: number;
  tanggal: string; // 'YYYY-MM-DD'
  jam_ke: number;
  status: 'hadir' | 'terlambat' | 'tidak_hadir';
  di_luar_radius: boolean;
  jarak_meter: number | null;
  latitude: number | null;
  longitude: number | null;
  foto_path: string | null;
  foto_valid: boolean;
  keterangan: string | null;
}

export interface Izin {
  id: number;
  guru_id: number;
  jenis: 'izin' | 'sakit' | 'cuti' | 'dinas_luar';
  tanggal_mulai: string;
  tanggal_selesai: string;
  jam_ke_awal: number | null;
  jam_ke_akhir: number | null;
  alasan: string | null;
  bukti_path: string | null;
  status: 'pending' | 'disetujui' | 'ditolak';
  approved_by: number | null;
  approved_at: string | null;
}
