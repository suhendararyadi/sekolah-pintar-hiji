"use client"

import * as React from "react";
import { PlusCircle, Trash2 } from "lucide-react";
import Cookies from 'js-cookie';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ScheduleForm, type ScheduleFormData } from "@/components/schedule-form";

// Definisikan tipe data
type Schedule = { id: number; day_of_week: number; start_time: string; end_time: string; class_name: string; subject_name: string; teacher_name: string; };
type Class = { id: number; name: string };
type Subject = { id: number; name: string };
type Teacher = { id: number; name: string };
type UserSession = { name: string; role: 'admin' | 'guru' | 'siswa' };
type ApiResponse = { success: boolean; schedules?: Schedule[]; classes?: Class[]; subjects?: Subject[]; teachers?: Teacher[]; user?: UserSession; message?: string; }

const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export default function ScheduleManagementPage() {
  const [currentUser, setCurrentUser] = React.useState<UserSession | null>(null);
  const [schedules, setSchedules] = React.useState<Schedule[]>([]);
  const [classes, setClasses] = React.useState<Class[]>([]);
  const [subjects, setSubjects] = React.useState<Subject[]>([]);
  const [teachers, setTeachers] = React.useState<Teacher[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  const getAuthToken = () => Cookies.get('authToken');

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    const token = getAuthToken();
    try {
      const [schedulesRes, classesRes, subjectsRes, teachersRes, userRes] = await Promise.all([
        fetch('/api/schedules', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/classes', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/subjects', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/teachers', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/me', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      if (schedulesRes.ok) setSchedules(((await schedulesRes.json()) as ApiResponse).schedules || []);
      if (classesRes.ok) setClasses(((await classesRes.json()) as ApiResponse).classes || []);
      if (subjectsRes.ok) setSubjects(((await subjectsRes.json()) as ApiResponse).subjects || []);
      if (teachersRes.ok) setTeachers(((await teachersRes.json()) as ApiResponse).teachers || []);
      if (userRes.ok) setCurrentUser(((await userRes.json()) as ApiResponse).user || null);

    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // PERBAIKAN: Implementasi penuh untuk fungsi handleSave
  const handleSave = async (data: ScheduleFormData) => {
    setIsSaving(true);
    const token = getAuthToken();
    try {
      const response = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        setIsDialogOpen(false);
        await fetchData();
      } else {
        const errorData: ApiResponse = await response.json();
        alert(`Error: ${errorData.message || 'Gagal menyimpan jadwal'}`);
      }
    } catch (error) {
      console.error("Save schedule failed:", error);
      alert("Terjadi kesalahan koneksi.");
    } finally {
      setIsSaving(false);
    }
  };
  
  // PERBAIKAN: Implementasi penuh untuk fungsi handleDelete
  const handleDelete = async (scheduleId: number) => {
    const token = getAuthToken();
    try {
        const response = await fetch(`/api/schedules/${scheduleId}`, { 
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            await fetchData();
        } else {
            const errorData: ApiResponse = await response.json();
            alert(`Error: ${errorData.message || 'Gagal menghapus jadwal'}`);
        }
    } catch (error) {
        console.error("Delete schedule failed:", error);
        alert("Terjadi kesalahan koneksi.");
    }
  };

  const groupedSchedules = schedules.reduce((acc, schedule) => {
    const day = dayNames[schedule.day_of_week];
    if (!acc[day]) acc[day] = [];
    acc[day].push(schedule);
    return acc;
  }, {} as Record<string, Schedule[]>);

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {currentUser?.role === 'admin' ? 'Manajemen Jadwal' : 'Jadwal Mengajar Saya'}
          </h1>
          <p className="text-muted-foreground">
            {currentUser?.role === 'admin' ? 'Atur jadwal pelajaran untuk semua kelas.' : 'Berikut adalah jadwal mengajar Anda.'}
          </p>
        </div>
        {currentUser?.role === 'admin' && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1">
                <PlusCircle className="h-4 w-4" />
                Tambah Jadwal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Tambah Jadwal Baru</DialogTitle></DialogHeader>
              <ScheduleForm classes={classes} subjects={subjects} teachers={teachers} onSave={handleSave} isSaving={isSaving} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="space-y-6">
        {loading ? <p>Memuat jadwal...</p> : Object.keys(groupedSchedules).map(day => (
          <Card key={day}>
            <CardHeader><CardTitle>{day}</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Waktu</TableHead>
                    <TableHead>Kelas</TableHead>
                    <TableHead>Mata Pelajaran</TableHead>
                    <TableHead>Guru</TableHead>
                    {currentUser?.role === 'admin' && <TableHead className="text-right">Aksi</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupedSchedules[day].map(schedule => (
                    <TableRow key={schedule.id}>
                      <TableCell>{schedule.start_time} - {schedule.end_time}</TableCell>
                      <TableCell>{schedule.class_name}</TableCell>
                      <TableCell>{schedule.subject_name}</TableCell>
                      <TableCell>{schedule.teacher_name}</TableCell>
                      {currentUser?.role === 'admin' && (
                        <TableCell className="text-right">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Hapus Jadwal?</AlertDialogTitle>
                                <AlertDialogDescription>Tindakan ini tidak bisa dibatalkan.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(schedule.id)}>Ya, Hapus</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
