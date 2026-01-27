"use client";

/**
 * Acciones del árbitro para responder emergencias
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface EmergencyActionsProps {
  emergencyId: string;
}

export function EmergencyActions({ emergencyId }: EmergencyActionsProps) {
  const router = useRouter();
  const [response, setResponse] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [action, setAction] = useState<"accept" | "reject" | null>(null);

  const handleSubmit = async (type: "accept" | "reject") => {
    if (!response.trim()) {
      toast.error("Debes proporcionar una respuesta");
      return;
    }

    setAction(type);
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/emergency/${emergencyId}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: type,
          response: response.trim(),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Error al procesar la solicitud");
      }

      toast.success(
        type === "accept"
          ? "Emergencia aceptada correctamente"
          : "Emergencia rechazada"
      );

      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Error al procesar la solicitud");
    } finally {
      setIsSubmitting(false);
      setAction(null);
    }
  };

  return (
    <Card className="border-2 border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle>Responder Emergencia</CardTitle>
        <CardDescription>
          Revisa la solicitud y proporciona tu respuesta como árbitro
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="response">Tu Respuesta *</Label>
          <Textarea
            id="response"
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Escribe tu respuesta, fundamentación o instrucciones..."
            rows={5}
            disabled={isSubmitting}
          />
          <p className="text-xs text-muted-foreground">
            Esta respuesta será notificada al solicitante y quedará registrada en el expediente.
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={() => handleSubmit("accept")}
            disabled={isSubmitting || !response.trim()}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {isSubmitting && action === "accept" ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Aceptar Emergencia
          </Button>
          <Button
            onClick={() => handleSubmit("reject")}
            disabled={isSubmitting || !response.trim()}
            variant="destructive"
            className="flex-1"
          >
            {isSubmitting && action === "reject" ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <XCircle className="h-4 w-4 mr-2" />
            )}
            Rechazar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
