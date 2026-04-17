import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { RecusacionesClient } from "./client";

export const metadata = { title: "Recusaciones | CAARD" };

export default async function RecusacionesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <RecusacionesClient userId={session.user.id} userRole={session.user.role} />
  );
}
