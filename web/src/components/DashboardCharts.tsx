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

const COLORS = {
  hadir: 'hsl(var(--chart-1))',
  terlambat: 'hsl(var(--chart-2))',
  tidak_hadir: 'hsl(var(--chart-3))',
};
const GRID = 'hsl(var(--chart-grid))';
const AXIS = 'hsl(var(--chart-axis))';

export function DailyLineChart({ data }: { data: RangeData['daily'] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} strokeOpacity={0.6} />
        <XAxis dataKey="label" fontSize={12} stroke={AXIS} tickLine={false} axisLine={false} />
        <YAxis allowDecimals={false} fontSize={12} stroke={AXIS} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{
            borderRadius: 'var(--radius-md)',
            border: '1px solid hsl(var(--border))',
            background: 'hsl(var(--popover))',
            color: 'hsl(var(--popover-foreground))',
            fontSize: 12,
            boxShadow: 'var(--shadow-md)',
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }} />
        <Line type="monotone" dataKey="hadir" name="Hadir" stroke={COLORS.hadir} strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
        <Line type="monotone" dataKey="terlambat" name="Terlambat" stroke={COLORS.terlambat} strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
        <Line type="monotone" dataKey="tidak_hadir" name="Tidak Hadir" stroke={COLORS.tidak_hadir} strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function StatusBarChart({ data }: { data: RangeData['status'] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} strokeOpacity={0.6} vertical={false} />
        <XAxis dataKey="name" fontSize={12} stroke={AXIS} tickLine={false} axisLine={false} />
        <YAxis allowDecimals={false} fontSize={12} stroke={AXIS} tickLine={false} axisLine={false} />
        <Tooltip
          cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
          contentStyle={{
            borderRadius: 'var(--radius-md)',
            border: '1px solid hsl(var(--border))',
            background: 'hsl(var(--popover))',
            color: 'hsl(var(--popover-foreground))',
            fontSize: 12,
            boxShadow: 'var(--shadow-md)',
          }}
        />
        <Bar dataKey="value" name="Jumlah" radius={[6, 6, 0, 0]} maxBarSize={48}>
          {data.map((d) => (
            <Cell key={d.name} fill={d.name === 'Hadir' ? COLORS.hadir : d.name === 'Terlambat' ? COLORS.terlambat : COLORS.tidak_hadir} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
