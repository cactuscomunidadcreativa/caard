import { redirect } from "next/navigation";

export default function StaffUsuariosRedirect() {
  redirect("/admin/users");
}
