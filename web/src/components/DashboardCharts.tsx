'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export type RangeData = {
  daily: { tanggal: string; label: string; hadir: number; terlambat: number; tidak_hadir: number }[];
  status: { name: string; value: number }[];
};

const COLORS = { hadir: '#22c55e', terlambat: '#eab308', tidak_hadir: '#ef4444' };

export function DailyLineChart({ data }: { data: RangeData['daily'] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="label" fontSize={12} />
        <YAxis allowDecimals={false} fontSize={12} />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="hadir" name="Hadir" stroke={COLORS.hadir} strokeWidth={2} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="terlambat" name="Terlambat" stroke={COLORS.terlambat} strokeWidth={2} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="tidak_hadir" name="Tidak Hadir" stroke={COLORS.tidak_hadir} strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function StatusBarChart({ data }: { data: RangeData['status'] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="name" fontSize={12} />
        <YAxis allowDecimals={false} fontSize={12} />
        <Tooltip />
        <Bar dataKey="value" name="Jumlah" radius={[4, 4, 0, 0]}>
          {data.map((d) => (
            <Cell key={d.name} fill={d.name === 'Hadir' ? COLORS.hadir : d.name === 'Terlambat' ? COLORS.terlambat : COLORS.tidak_hadir} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
