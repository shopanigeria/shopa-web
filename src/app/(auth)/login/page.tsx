import type { Metadata } from "next";

export const metadata: Metadata = { title: "Login" };

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-50 p-4">
      <div className="card-base w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
        <p className="mt-1 text-sm text-muted-foreground">Sign in to your Shopa account</p>
        {/* LoginForm component will go here */}
      </div>
    </main>
  );
}
