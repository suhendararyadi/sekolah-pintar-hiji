"use client"

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Skema validasi untuk form
const formSchema = z.object({
  class_id: z.string({ required_error: "Kelas harus dipilih." }),
  subject_id: z.string({ required_error: "Mata pelajaran harus dipilih." }),
  teacher_id: z.string({ required_error: "Guru harus dipilih." }),
  day_of_week: z.string({ required_error: "Hari harus dipilih." }),
  start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Format jam tidak valid (HH:MM)."),
  end_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Format jam tidak valid (HH:MM)."),
});

export type ScheduleFormData = z.infer<typeof formSchema>;

// Tipe data untuk props
type Class = { id: number; name: string };
type Subject = { id: number; name: string };
type Teacher = { id: number; name: string };

interface ScheduleFormProps {
  classes: Class[];
  subjects: Subject[];
  teachers: Teacher[];
  onSave: (data: ScheduleFormData) => void;
  isSaving: boolean;
}

const days = [
    { id: 1, name: "Senin" }, { id: 2, name: "Selasa" }, { id: 3, name: "Rabu" },
    { id: 4, name: "Kamis" }, { id: 5, name: "Jumat" }, { id: 6, name: "Sabtu" }
];

export function ScheduleForm({ classes, subjects, teachers, onSave, isSaving }: ScheduleFormProps) {
  const form = useForm<ScheduleFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      start_time: "07:30",
      end_time: "09:00",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
        <FormField control={form.control} name="day_of_week" render={({ field }) => (
          <FormItem><FormLabel>Hari</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="Pilih hari" /></SelectTrigger></FormControl>
              <SelectContent>{days.map(d => <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>)}</SelectContent>
            </Select>
          <FormMessage /></FormItem>
        )} />
        <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="start_time" render={({ field }) => (
                <FormItem><FormLabel>Jam Mulai</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="end_time" render={({ field }) => (
                <FormItem><FormLabel>Jam Selesai</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
        </div>
        <FormField control={form.control} name="class_id" render={({ field }) => (
          <FormItem><FormLabel>Kelas</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="Pilih kelas" /></SelectTrigger></FormControl>
              <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          <FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="subject_id" render={({ field }) => (
          <FormItem><FormLabel>Mata Pelajaran</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="Pilih mata pelajaran" /></SelectTrigger></FormControl>
              <SelectContent>{subjects.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
          <FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="teacher_id" render={({ field }) => (
          <FormItem><FormLabel>Guru</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="Pilih guru" /></SelectTrigger></FormControl>
              <SelectContent>{teachers.map(t => <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>)}</SelectContent>
            </Select>
          <FormMessage /></FormItem>
        )} />
        <Button type="submit" disabled={isSaving} className="w-full">
          {isSaving ? "Menyimpan..." : "Simpan Jadwal"}
        </Button>
      </form>
    </Form>
  );
}
