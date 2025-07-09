"use client"

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Skema validasi menggunakan Zod
// Beberapa field hanya wajib jika perannya adalah 'siswa'
export const userFormSchema = z.object({
  name: z.string().min(2, { message: "Nama minimal 2 karakter." }),
  email: z.string().email({ message: "Email tidak valid." }),
  password: z.string().optional(),
  role: z.enum(["admin", "guru", "siswa"]),
  // Field khusus siswa
  nisn: z.string().optional(),
  address: z.string().optional(),
  phone_number: z.string().optional(),
  parent_name: z.string().optional(),
  class_id: z.string().optional(), // class_id akan berupa string dari form
}).superRefine((data, ctx) => {
  // Jika peran adalah siswa, maka nisn dan class_id wajib diisi
  if (data.role === 'siswa') {
    if (!data.nisn || data.nisn.trim() === "") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "NISN wajib diisi untuk siswa.", path: ["nisn"] });
    }
    if (!data.class_id) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Kelas wajib dipilih untuk siswa.", path: ["class_id"] });
    }
  }
});

// Ekspor tipe yang di-infer dari skema agar bisa digunakan di file lain.
export type UserFormData = z.infer<typeof userFormSchema>;

// Tipe data untuk user yang diedit (bisa memiliki lebih banyak properti)
type User = { 
  id?: number; 
  name: string; 
  email: string; 
  role: 'admin' | 'guru' | 'siswa'; 
  nisn?: string;
  address?: string;
  phone_number?: string;
  parent_name?: string;
  class_id?: number 
};

// Tipe data untuk daftar kelas
type Class = { id: number; name: string };

interface UserFormProps {
  user?: User | null;
  classes: Class[];
  onSave: (data: UserFormData) => void;
  isSaving: boolean;
}

export function UserForm({ user, classes, onSave, isSaving }: UserFormProps) {
  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      password: "",
      role: user?.role || "siswa",
      nisn: user?.nisn || "",
      address: user?.address || "",
      phone_number: user?.phone_number || "",
      parent_name: user?.parent_name || "",
      class_id: user?.class_id?.toString() || "",
    },
  });

  const isEditing = !!user;
  const selectedRole = form.watch("role");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSave)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Lengkap</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="john.doe@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
              {!isEditing && <p className="text-xs text-muted-foreground">Wajib diisi untuk pengguna baru.</p>}
              {isEditing && <p className="text-xs text-muted-foreground">Kosongkan jika tidak ingin mengubah password.</p>}
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Peran</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Pilih peran" /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="guru">Guru</SelectItem>
                  <SelectItem value="siswa">Siswa</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tampilkan field ini hanya jika peran adalah siswa */}
        {selectedRole === 'siswa' && (
          <>
            <FormField control={form.control} name="nisn" render={({ field }) => (
              <FormItem><FormLabel>NISN</FormLabel><FormControl><Input placeholder="Nomor Induk Siswa Nasional" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="class_id" render={({ field }) => (
              <FormItem><FormLabel>Kelas</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Pilih kelas" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {classes.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              <FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="address" render={({ field }) => (
              <FormItem><FormLabel>Alamat</FormLabel><FormControl><Input placeholder="Alamat lengkap" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="phone_number" render={({ field }) => (
              <FormItem><FormLabel>No. Telepon</FormLabel><FormControl><Input placeholder="08xxxxxxxx" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="parent_name" render={({ field }) => (
              <FormItem><FormLabel>Nama Orang Tua</FormLabel><FormControl><Input placeholder="Nama Ayah/Ibu/Wali" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
          </>
        )}

        <Button type="submit" disabled={isSaving} className="w-full">
          {isSaving ? "Menyimpan..." : "Simpan"}
        </Button>
      </form>
    </Form>
  );
}
