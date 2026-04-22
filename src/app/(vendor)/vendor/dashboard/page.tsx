import type { Metadata } from "next";

export const metadata: Metadata = { title: "Vendor Dashboard" };

export default function VendorDashboardPage() {
  return (
    <main className="container-app py-6">
      <h1 className="text-2xl font-bold">Vendor Dashboard</h1>
    </main>
  );
}
