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

// PERBAIKAN: Definisikan skema di sini, karena file ini menggunakan
// zodResolver yang membutuhkan skema sebagai 'value'.
export const userFormSchema = z.object({
  name: z.string().min(2, { message: "Nama minimal 2 karakter." }),
  email: z.string().email({ message: "Email tidak valid." }),
  password: z.string().optional(),
  role: z.enum(["admin", "guru", "siswa"]),
});

// PERBAIKAN: Ekspor tipe yang di-infer dari skema agar bisa digunakan di file lain.
export type UserFormData = z.infer<typeof userFormSchema>;

type User = { id?: number; name: string; email: string; role: 'admin' | 'guru' | 'siswa' };

interface UserFormProps {
  user?: User | null;
  onSave: (data: UserFormData) => void;
  isSaving: boolean;
}

export function UserForm({ user, onSave, isSaving }: UserFormProps) {
  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      password: "",
      role: user?.role || "siswa",
    },
  });

  const isEditing = !!user;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
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
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih peran" />
                  </SelectTrigger>
                </FormControl>
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
        <Button type="submit" disabled={isSaving} className="w-full">
          {isSaving ? "Menyimpan..." : "Simpan"}
        </Button>
      </form>
    </Form>
  );
}
