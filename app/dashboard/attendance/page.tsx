"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Cookies from 'js-cookie';

// Definisikan tipe data
type Class = { id: number; name: string; };
type Student = { id: number; name: string; status?: AttendanceStatus | null; };
type AttendanceStatus = 'Hadir' | 'Sakit' | 'Izin' | 'Alfa';
type ApiResponse = { success: boolean; classes?: Class[]; students?: Student[]; message?: string; }

export default function DailyAttendancePage() {
  const [classes, setClasses] = React.useState<Class[]>([]);
  const [students, setStudents] = React.useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = React.useState<string>("");
  const [selectedDate, setSelectedDate] = React.useState<string>(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = React.useState<Map<number, AttendanceStatus>>(new Map());
  const [loading, setLoading] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

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

  const fetchStudentsForAttendance = async () => {
    if (!selectedClass || !selectedDate) return;
    setLoading(true);
    const token = getAuthToken();
    try {
      const response = await fetch(`/api/attendance/class/${selectedClass}?date=${selectedDate}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data: ApiResponse = await response.json();
        const studentList = data.students || [];
        setStudents(studentList);
        
        const initialAttendance = new Map<number, AttendanceStatus>();
        studentList.forEach((student: Student) => {
          initialAttendance.set(student.id, student.status || 'Hadir');
        });
        setAttendance(initialAttendance);
      }
    } catch (error) {
      console.error("Gagal mengambil data siswa:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId: number, status: AttendanceStatus) => {
    setAttendance(prev => new Map(prev).set(studentId, status));
  };

  const handleSaveAttendance = async () => {
    if (!selectedClass || !selectedDate) return;
    setIsSaving(true);
    const token = getAuthToken();
    const records = Array.from(attendance.entries()).map(([student_id, status]) => ({ student_id, status }));

    try {
      const response = await fetch('/api/attendance/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ class_id: parseInt(selectedClass), date: selectedDate, records }),
      });
      if (response.ok) {
        alert("Absensi berhasil disimpan!");
      } else {
        // PERBAIKAN: Beri tahu TypeScript bentuk data error yang diharapkan
        const errorData: ApiResponse = await response.json();
        alert(`Gagal menyimpan: ${errorData.message}`);
      }
    } catch (error) {
      // PERBAIKAN: Gunakan variabel error untuk logging
      console.error("Save attendance failed:", error);
      alert("Terjadi kesalahan koneksi.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Absensi Harian</CardTitle>
          <CardDescription>Pilih kelas dan tanggal untuk mencatat kehadiran siswa.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-full md:w-[200px]"><SelectValue placeholder="Pilih Kelas" /></SelectTrigger>
              <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
            <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-full md:w-[180px]" />
            <Button onClick={fetchStudentsForAttendance} disabled={!selectedClass || !selectedDate || loading}>
              {loading ? "Memuat..." : "Tampilkan Siswa"}
            </Button>
          </div>

          {students.length > 0 && (
            <div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No.</TableHead>
                    <TableHead>Nama Siswa</TableHead>
                    <TableHead className="w-[150px]">Status Kehadiran</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student, index) => (
                    <TableRow key={student.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>
                        <Select value={attendance.get(student.id) || 'Hadir'} onValueChange={(value) => handleStatusChange(student.id, value as AttendanceStatus)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Hadir">Hadir</SelectItem>
                            <SelectItem value="Sakit">Sakit</SelectItem>
                            <SelectItem value="Izin">Izin</SelectItem>
                            <SelectItem value="Alfa">Alfa</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-end mt-6">
                <Button onClick={handleSaveAttendance} disabled={isSaving}>
                  {isSaving ? "Menyimpan..." : "Simpan Absensi"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
