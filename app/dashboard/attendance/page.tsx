"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import Cookies from 'js-cookie';

// Definisikan tipe data yang akan kita gunakan
type Schedule = {
  id: number;
  class_name: string;
  subject_name: string;
  start_time: string;
  end_time: string;
};

// PERBAIKAN: Tipe Student sekarang bisa memiliki status
type Student = {
  id: number;
  name: string;
  status?: AttendanceStatus | null; // Status bisa jadi null jika belum ada record
};

type AttendanceStatus = 'Hadir' | 'Sakit' | 'Izin' | 'Alfa';

type ApiResponse = {
    success: boolean;
    schedules?: Schedule[];
    students?: Student[];
    message?: string;
}

export default function AttendancePage() {
  const [schedules, setSchedules] = React.useState<Schedule[]>([]);
  const [selectedSchedule, setSelectedSchedule] = React.useState<Schedule | null>(null);
  const [students, setStudents] = React.useState<Student[]>([]);
  const [attendance, setAttendance] = React.useState<Map<number, AttendanceStatus>>(new Map());
  const [loading, setLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);

  const getAuthToken = () => Cookies.get('authToken');

  // Ambil jadwal mengajar guru untuk hari ini
  React.useEffect(() => {
    const fetchSchedules = async () => {
      setLoading(true);
      const token = getAuthToken();
      try {
        const response = await fetch('/api/attendance/schedules', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data: ApiResponse = await response.json();
          setSchedules(data.schedules || []);
        }
      } catch (error) {
        console.error("Gagal mengambil jadwal:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSchedules();
  }, []);

  // Ambil daftar siswa ketika jadwal dipilih
  const handleScheduleSelect = async (scheduleId: string) => {
    const schedule = schedules.find(s => s.id.toString() === scheduleId);
    if (!schedule) return;

    setSelectedSchedule(schedule);
    setLoading(true);
    const token = getAuthToken();
    try {
      const response = await fetch(`/api/attendance/schedules/${scheduleId}/students`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data: ApiResponse = await response.json();
        const studentList = data.students || [];
        setStudents(studentList);
        
        // PERBAIKAN UTAMA: Set status awal berdasarkan data dari backend
        const initialAttendance = new Map<number, AttendanceStatus>();
        studentList.forEach((student: Student) => {
          // Jika sudah ada status dari DB, gunakan itu. Jika tidak, default ke "Hadir".
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
    if (!selectedSchedule) return;
    setIsSaving(true);
    const token = getAuthToken();
    const records = Array.from(attendance.entries()).map(([student_id, status]) => ({
      student_id,
      status,
    }));

    try {
      const response = await fetch('/api/attendance/records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          schedule_id: selectedSchedule.id,
          records: records,
        }),
      });

      if (response.ok) {
        alert("Absensi berhasil disimpan!");
        // Reset state setelah berhasil menyimpan
        setSelectedSchedule(null);
        setStudents([]);
        setAttendance(new Map());
      } else {
        const errorData: ApiResponse = await response.json();
        alert(`Gagal menyimpan: ${errorData.message}`);
      }
    } catch (error) {
      console.error("Gagal menyimpan absensi:", error);
      alert("Terjadi kesalahan koneksi.");
    } finally {
      setIsSaving(false);
    }
  };


  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Daftar Kehadiran Siswa</CardTitle>
          <CardDescription>
            Pilih jadwal mengajar Anda hari ini untuk memulai absensi.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="w-full md:w-1/3">
            <Select onValueChange={handleScheduleSelect} disabled={schedules.length === 0 || loading} value={selectedSchedule ? selectedSchedule.id.toString() : ""}>
              <SelectTrigger>
                <SelectValue placeholder={loading ? "Memuat jadwal..." : "Pilih Jadwal Mengajar"} />
              </SelectTrigger>
              <SelectContent>
                {schedules.map((schedule) => (
                  <SelectItem key={schedule.id} value={schedule.id.toString()}>
                    {`${schedule.class_name} - ${schedule.subject_name} (${schedule.start_time} - ${schedule.end_time})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedSchedule && (
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Daftar Siswa - {selectedSchedule.class_name}
              </h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No.</TableHead>
                    <TableHead>Nama Siswa</TableHead>
                    <TableHead className="w-[150px]">Status Kehadiran</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={3} className="text-center">Memuat siswa...</TableCell></TableRow>
                  ) : (
                    students.map((student, index) => (
                      <TableRow key={student.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell>
                          <Select
                            value={attendance.get(student.id) || 'Hadir'}
                            onValueChange={(value) => handleStatusChange(student.id, value as AttendanceStatus)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Hadir">Hadir</SelectItem>
                              <SelectItem value="Sakit">Sakit</SelectItem>
                              <SelectItem value="Izin">Izin</SelectItem>
                              <SelectItem value="Alfa">Alfa</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <div className="flex justify-end mt-6">
                <Button onClick={handleSaveAttendance} disabled={students.length === 0 || isSaving}>
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
