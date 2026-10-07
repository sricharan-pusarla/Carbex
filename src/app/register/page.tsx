"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { registerUser } from "@/app/actions/auth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Leaf, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState("BUYER");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("role", role);

    const result = await registerUser(formData);

    if (!result.success) {
      setError(result.error || "Registration failed.");
      setLoading(false);
      return;
    }

    // Auto sign-in after registration
    const signInResult = await signIn("credentials", {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      redirect: false,
    });

    if (signInResult?.error) {
      setError("Account created but login failed. Please sign in manually.");
      setLoading(false);
    } else {
      router.push(role === "SELLER" ? "/seller" : "/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <Leaf className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">Carbex</span>
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight">Create your account</h1>
          <p className="text-muted-foreground mt-2">Join the most transparent carbon marketplace</p>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>Sign Up</CardTitle>
            <CardDescription>All fields are required to create your account.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Full Name</label>
                <Input name="name" required placeholder="John Doe" className="h-11" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Email Address</label>
                <Input name="email" type="email" required placeholder="you@example.com" className="h-11" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Password</label>
                <Input name="password" type="password" required placeholder="Min. 6 characters" minLength={6} className="h-11" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Account Type</label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BUYER">Buyer — Purchase & retire credits</SelectItem>
                    <SelectItem value="SELLER">Seller — List carbon projects</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {role === "SELLER" && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Organization Name</label>
                  <Input name="organization" placeholder="Your company or project name" className="h-11" />
                </div>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-200 text-red-600 p-3 rounded-lg flex items-center gap-2 text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Account
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="text-primary font-semibold hover:underline">
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
