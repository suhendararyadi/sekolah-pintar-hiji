"use client"

import * as React from "react";
import { PlusCircle, MoreHorizontal } from "lucide-react";
import { UserForm, type UserFormData } from "@/components/user-form";
import Cookies from 'js-cookie';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

// Definisikan tipe data
type User = { id: number; name: string; email: string; role: 'admin' | 'guru' | 'siswa'; created_at: string; nisn?: string; class_name?: string; };
type Class = { id: number; name: string; };
type ApiResponse = { success: boolean; users?: User[]; classes?: Class[]; message?: string; }

export default function UserManagementPage() {
  const [users, setUsers] = React.useState<User[]>([]);
  const [classes, setClasses] = React.useState<Class[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<User | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  const getAuthToken = () => Cookies.get('authToken');

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    const token = getAuthToken();
    try {
      const [usersRes, classesRes] = await Promise.all([
        fetch('/api/users', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/classes', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      if (usersRes.ok) {
        const data: ApiResponse = await usersRes.json();
        setUsers(data.users || []);
      }
      if (classesRes.ok) {
        const data: ApiResponse = await classesRes.json();
        setClasses(data.classes || []);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async (data: UserFormData) => {
    setIsSaving(true);
    const token = getAuthToken();
    
    const isStudent = data.role === 'siswa';
    const endpoint = isStudent ? '/api/students' : '/api/users';
    const method = editingUser ? 'PUT' : 'POST';
    const url = editingUser ? `/api/users/${editingUser.id}` : endpoint;

    try {
      const response = await fetch(url, { 
        method, 
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }, 
        body: JSON.stringify(data) 
      });

      if (response.ok) {
        setIsDialogOpen(false);
        setEditingUser(null);
        await fetchData(); // Refresh data
      } else {
        const errorData: ApiResponse = await response.json();
        alert(`Error: ${errorData.message || 'Gagal menyimpan data'}`);
      }
    } catch (error) {
        console.error("Save operation failed:", error);
        alert("Terjadi kesalahan koneksi.");
    } finally {
        setIsSaving(false);
    }
  };

  const handleDelete = async (userId: number) => {
    const token = getAuthToken();
    try {
        const response = await fetch(`/api/users/${userId}`, { 
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
            await fetchData(); // Refresh data
        } else {
            const errorData: ApiResponse = await response.json();
            alert(`Error: ${errorData.message || 'Gagal menghapus data'}`);
        }
    } catch (error) {
        console.error("Delete operation failed:", error);
        alert("Terjadi kesalahan koneksi.");
    }
  };

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Manajemen Pengguna</CardTitle>
              <CardDescription>Tambah, edit, atau hapus data pengguna.</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) setEditingUser(null);
            }}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1">
                  <PlusCircle className="h-3.5 w-3.5" />
                  Tambah Pengguna
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingUser ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}</DialogTitle>
                </DialogHeader>
                <UserForm user={editingUser} classes={classes} onSave={handleSave} isSaving={isSaving} />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead>Peran</TableHead>
                <TableHead className="hidden md:table-cell">NISN</TableHead>
                <TableHead className="hidden md:table-cell">Kelas</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center">Memuat data...</TableCell></TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="hidden md:table-cell">{user.email}</TableCell>
                    <TableCell><Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>{user.role}</Badge></TableCell>
                    <TableCell className="hidden md:table-cell">{user.nisn || '-'}</TableCell>
                    <TableCell className="hidden md:table-cell">{user.class_name || '-'}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                          <DropdownMenuItem onSelect={() => { setEditingUser(user); setIsDialogOpen(true); }}>Edit</DropdownMenuItem>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Hapus</DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
                                <AlertDialogDescription>Tindakan ini tidak bisa dibatalkan. Ini akan menghapus pengguna secara permanen.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(user.id)}>Ya, Hapus</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
