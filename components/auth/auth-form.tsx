"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import Logo from "@/components/branding/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ThemeToggle from "@/components/theme-toggle";
import { apiClient } from "@/lib/api/client";
import { API_ROUTES } from "@/lib/api/routes";
import { useAuthStore } from "@/stores/auth-store";
import { AuthPayload } from "@/types/auth";

type AuthFormProps = {
  mode: "login" | "register";
};

function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useAuthStore((state) => state.login);

  const [pending, setPending] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const isRegister = mode === "register";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);

    try {
      const route = isRegister ? API_ROUTES.register : API_ROUTES.login;
      const payload = await apiClient<AuthPayload>(route, {
        method: "POST",
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      if (!payload.data) {
        throw new Error("Invalid authentication response.");
      }

      login({ user: payload.data.user, token: payload.data.sessionToken });
      toast.success(isRegister ? "Account created successfully" : "Logged in successfully");

      const next = searchParams.get("next");
      router.push(next || "/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Authentication failed");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="container flex min-h-[calc(100vh-4rem)] items-center justify-center py-10">
      <Card className="glass w-full max-w-md rounded-2xl shadow-2xl">
        <CardHeader>
          <div className="mb-4 flex items-center justify-between">
            <Logo />
            <ThemeToggle />
          </div>
          <CardTitle>{isRegister ? "Create your workspace" : "Welcome back"}</CardTitle>
          <CardDescription>
            {isRegister
              ? "Start building your enterprise knowledge assistant in minutes."
              : "Sign in to access your intelligence dashboard."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            {isRegister && (
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Jane Doe"
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : isRegister ? "Create account" : "Sign in"}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            {isRegister ? "Already have an account?" : "New to Knowledge IQ?"} {" "}
            <Link
              href={isRegister ? "/login" : "/register"}
              className="font-medium text-primary hover:underline"
            >
              {isRegister ? "Sign in" : "Create account"}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default AuthForm;
