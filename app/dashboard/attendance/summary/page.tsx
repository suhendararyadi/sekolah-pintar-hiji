"use client";

import * as React from "react";
import Cookies from 'js-cookie';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Definisikan tipe data
type Class = { id: number; name: string; };
type SummaryRecord = {
  student_id: number;
  student_name: string;
  records: Record<string, 'Hadir' | 'Sakit' | 'Izin' | 'Alfa'>; // { '2024-07-17': 'Hadir' }
};
type ApiResponse = { success: boolean; classes?: Class[]; summary?: SummaryRecord[]; message?: string; }

const months = [
    { value: "1", label: "Januari" }, { value: "2", label: "Februari" }, { value: "3", label: "Maret" },
    { value: "4", label: "April" }, { value: "5", label: "Mei" }, { value: "6", label: "Juni" },
    { value: "7", label: "Juli" }, { value: "8", label: "Agustus" }, { value: "9", label: "September" },
    { value: "10", label: "Oktober" }, { value: "11", label: "November" }, { value: "12", label: "Desember" }
];
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

export default function AttendanceSummaryPage() {
  const [classes, setClasses] = React.useState<Class[]>([]);
  const [summaryData, setSummaryData] = React.useState<SummaryRecord[]>([]);
  const [selectedClass, setSelectedClass] = React.useState<string>("");
  const [selectedMonth, setSelectedMonth] = React.useState<string>((new Date().getMonth() + 1).toString());
  const [selectedYear, setSelectedYear] = React.useState<string>(currentYear.toString());
  const [loading, setLoading] = React.useState(false);

  const getAuthToken = () => Cookies.get('authToken');

  // Fetch daftar kelas saat komponen dimuat
  React.useEffect(() => {
    const fetchClasses = async () => {
      const token = getAuthToken();
      const response = await fetch('/api/classes', { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.ok) {
        const data: ApiResponse = await response.json();
        setClasses(data.classes || []);
      }
    };
    fetchClasses();
  }, []);

  const fetchSummary = async () => {
    if (!selectedClass || !selectedMonth || !selectedYear) return;
    setLoading(true);
    const token = getAuthToken();
    try {
      const response = await fetch(`/api/attendance/summary?class_id=${selectedClass}&month=${selectedMonth}&year=${selectedYear}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data: ApiResponse = await response.json();
        setSummaryData(data.summary || []);
      }
    } catch (error) {
      console.error("Gagal mengambil laporan:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (month: number, year: number) => new Date(year, month, 0).getDate();
  const daysInSelectedMonth = getDaysInMonth(parseInt(selectedMonth), parseInt(selectedYear));

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Laporan Kehadiran Bulanan</CardTitle>
          <CardDescription>Pilih kelas dan periode untuk melihat rekapitulasi kehadiran.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-full md:w-[200px]"><SelectValue placeholder="Pilih Kelas" /></SelectTrigger>
              <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Pilih Bulan" /></SelectTrigger>
              <SelectContent>{months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-full md:w-[120px]"><SelectValue placeholder="Pilih Tahun" /></SelectTrigger>
              <SelectContent>{years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
            </Select>
            <Button onClick={fetchSummary} disabled={!selectedClass || loading}>
              {loading ? "Memuat..." : "Tampilkan Laporan"}
            </Button>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-background">Nama Siswa</TableHead>
                  {Array.from({ length: daysInSelectedMonth }, (_, i) => i + 1).map(day => (
                    <TableHead key={day} className="text-center">{day}</TableHead>
                  ))}
                  <TableHead className="text-center font-bold">H</TableHead>
                  <TableHead className="text-center font-bold">S</TableHead>
                  <TableHead className="text-center font-bold">I</TableHead>
                  <TableHead className="text-center font-bold">A</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summaryData.map(student => {
                  const summary = { H: 0, S: 0, I: 0, A: 0 };
                  Object.values(student.records).forEach(status => {
                    if (status === 'Hadir') summary.H++;
                    if (status === 'Sakit') summary.S++;
                    if (status === 'Izin') summary.I++;
                    if (status === 'Alfa') summary.A++;
                  });
                  return (
                    <TableRow key={student.student_id}>
                      <TableCell className="font-medium sticky left-0 bg-background">{student.student_name}</TableCell>
                      {Array.from({ length: daysInSelectedMonth }, (_, i) => i + 1).map(day => {
                        const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const status = student.records[dateStr];
                        return <TableCell key={day} className="text-center">{status ? status.charAt(0) : '-'}</TableCell>;
                      })}
                      <TableCell className="text-center font-bold">{summary.H}</TableCell>
                      <TableCell className="text-center font-bold">{summary.S}</TableCell>
                      <TableCell className="text-center font-bold">{summary.I}</TableCell>
                      <TableCell className="text-center font-bold">{summary.A}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
