import { redirect } from "next/navigation";
import { getCurrentUserFromCookies } from "@/lib/authServer";
import UsersAdminClient from "./UsersAdminClient";

export default async function AdminUsersPage() {
  const user = await getCurrentUserFromCookies();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "ADMIN") {
    redirect("/");
  }

  return <UsersAdminClient />;
}
