    // ==============================================================================
    // FILE: components/login-form.tsx (Frontend Form Login) - DIPERBARUI
    // ==============================================================================
    // TUJUAN: Mengubah penyimpanan token dari localStorage ke http-only cookie
    //         melalui API route untuk keamanan yang lebih baik.

    "use client";

    import { useState } from "react";
    import { useRouter } from "next/navigation";
    import { cn } from "@/lib/utils";
    import { Button } from "@/components/ui/button";
    import {
      Card,
      CardContent,
      CardDescription,
      CardHeader,
      CardTitle,
    } from "@/components/ui/card";
    import { Input } from "@/components/ui/input";
    import { Label } from "@/components/ui/label";

    type ApiResponse = {
      success: boolean;
      message: string;
      token?: string;
    };

    export function LoginForm({
      className,
      ...props
    }: React.ComponentProps<"div">) {
      const router = useRouter();
      const [email, setEmail] = useState("");
      const [password, setPassword] = useState("");
      const [error, setError] = useState<string | null>(null);
      const [isLoading, setIsLoading] = useState(false);

      const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
          const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });

          const data: ApiResponse = await response.json();

          if (!response.ok || !data.success) {
            throw new Error(data.message || 'Terjadi kesalahan');
          }
          
          // PERUBAHAN: Kita tidak lagi menyimpan token di sini.
          // Backend (Worker) akan mengatur cookie secara langsung.
          // Cukup redirect jika sukses.
          console.log('Login sukses, mengarahkan ke dashboard...');
          router.push('/dashboard');

        } catch (err: unknown) {
          if (err instanceof Error) {
            setError(err.message);
          } else {
            setError("Terjadi kesalahan yang tidak dikenal.");
          }
        } finally {
          setIsLoading(false);
        }
      };

      return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
          <Card>
            <CardHeader>
              <CardTitle>Login to your account</CardTitle>
              <CardDescription>
                Enter your email below to login to your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-3">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="siswa@sekolah.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="grid gap-3">
                    <div className="flex items-center">
                      <Label htmlFor="password">Password</Label>
                      <a
                        href="#"
                        className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                      >
                        Forgot your password?
                      </a>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      placeholder="123456"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  
                  {error && (
                    <p className="text-sm font-medium text-destructive">{error}</p>
                  )}

                  <div className="flex flex-col gap-3">
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Logging in...' : 'Login'}
                    </Button>
                    <Button variant="outline" className="w-full" type="button" disabled={isLoading}>
                      Login with Google
                    </Button>
                  </div>
                </div>
                <div className="mt-4 text-center text-sm">
                  Don&apos;t have an account?{" "}
                  <a href="#" className="underline underline-offset-4">
                    Sign up
                  </a>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      );
    }
    