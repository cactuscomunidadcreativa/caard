import { redirect } from "next/navigation";

export default function AbogadoAnalizarRedirect() {
  redirect("/abogado/asistente?tab=analizar");
}
