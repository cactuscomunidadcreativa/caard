/**
 * CAARD - Alias de /calculadora
 * Redirige para mantener una sola calculadora oficial.
 */
import { redirect } from "next/navigation";

export default function CalculadoraGastosAlias() {
  redirect("/calculadora");
}
