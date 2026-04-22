import { redirect } from "next/navigation";

export default function AdminCmsCenterRedirect() {
  redirect("/admin/cms/config");
}
