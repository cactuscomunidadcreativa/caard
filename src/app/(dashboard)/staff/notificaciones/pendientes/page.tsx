import { redirect } from "next/navigation";

export default function StaffNotifPendientesRedirect() {
  redirect("/notifications?status=QUEUED");
}
