"use client"

import * as React from "react";
import Papa from "papaparse";
// PERBAIKAN: Hapus import 'Upload' yang tidak terpakai
// import { Upload } from "lucide-react"; 

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DialogFooter } from "@/components/ui/dialog";
import Cookies from 'js-cookie';

interface UserImportDialogProps {
  onImportSuccess: () => void;
  onClose: () => void;
}

// Definisikan tipe data untuk hasil parsing
type ParsedUser = {
  name: string;
  email: string;
  password?: string;
  nisn?: string;
};

// PERBAIKAN: Definisikan tipe untuk respons API
type ApiResponse = {
  success: boolean;
  message?: string;
}

export function UserImportDialog({ onImportSuccess, onClose }: UserImportDialogProps) {
  // PERBAIKAN: Hapus state 'file' yang tidak terpakai
  // const [file, setFile] = React.useState<File | null>(null);
  const [parsedData, setParsedData] = React.useState<ParsedUser[]>([]);
  const [isParsing, setIsParsing] = React.useState(false);
  const [isImporting, setIsImporting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setParsedData([]);
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // setFile(selectedFile); // Tidak perlu lagi
      parseFile(selectedFile);
    }
  };

  const parseFile = (fileToParse: File) => {
    setIsParsing(true);
    Papa.parse(fileToParse, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setParsedData(results.data as ParsedUser[]);
        setIsParsing(false);
      },
      error: (err) => {
        setError(`Gagal mem-parsing file: ${err.message}`);
        setIsParsing(false);
      },
    });
  };

  const handleImport = async () => {
    if (parsedData.length === 0) {
      setError("Tidak ada data untuk diimpor.");
      return;
    }
    setIsImporting(true);
    setError(null);
    const token = Cookies.get('authToken');

    try {
      const response = await fetch('/api/students/bulk', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ students: parsedData }),
      });

      if (response.ok) {
        alert("Import data siswa berhasil!");
        onImportSuccess();
        onClose();
      } else {
        // PERBAIKAN: Beri tahu TypeScript bentuk data error yang diharapkan
        const errorData: ApiResponse = await response.json();
        throw new Error(errorData.message || "Gagal mengimpor data.");
      }
    } catch (err: unknown) { // PERBAIKAN: Tangkap error sebagai 'unknown'
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Terjadi kesalahan yang tidak dikenal.");
      }
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-1 items-center gap-4">
        <Input
          id="csv-file"
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          disabled={isParsing || isImporting}
        />
        <p className="text-xs text-muted-foreground">
          Unggah file CSV dengan header: `name`, `email`, `password`, `nisn`.
        </p>
      </div>
      
      {error && <p className="text-sm text-destructive">{error}</p>}

      {parsedData.length > 0 && (
        <div>
          <h4 className="font-medium mb-2">Pratinjau Data (5 baris pertama)</h4>
          <div className="rounded-md border max-h-60 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>NISN</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parsedData.slice(0, 5).map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.email}</TableCell>
                    <TableCell>{row.nisn}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <DialogFooter>
        <Button
          onClick={handleImport}
          disabled={parsedData.length === 0 || isParsing || isImporting}
        >
          {isImporting ? "Mengimpor..." : "Mulai Import"}
        </Button>
      </DialogFooter>
    </div>
  );
}
