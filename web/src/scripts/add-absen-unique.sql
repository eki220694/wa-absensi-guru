-- Migration: Add UNIQUE constraint to absen table to prevent duplicate check-ins
-- Run this if the table was created before the constraint was added to migrate.ts

ALTER TABLE absen
ADD CONSTRAINT absen_guru_jadwal_tgl_unique UNIQUE (guru_id, jadwal_id, tanggal);