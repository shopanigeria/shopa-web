import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin Dashboard" };

export default function AdminDashboardPage() {
  return (
    <main className="container-app py-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
    </main>
  );
}
