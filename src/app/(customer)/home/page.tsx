import type { Metadata } from "next";

export const metadata: Metadata = { title: "Home" };

export default function HomePage() {
  return (
    <main className="container-app py-6">
      <h1 className="text-2xl font-bold">Home</h1>
      {/* HomeScreen components will go here */}
    </main>
  );
}
