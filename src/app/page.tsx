import { redirect } from "next/navigation";

// Root redirect — middleware handles auth, this just redirects the naked "/" to login
export default function RootPage() {
  redirect("/login");
}
