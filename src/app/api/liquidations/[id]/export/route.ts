/**
 * CAARD - API de Exportación de Liquidación a Excel
 * GET: Generar y descargar archivo Excel
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";

interface Props {
  params: Promise<{ id: string }>;
}

// Función para formatear montos
function formatAmount(cents: number): string {
  return `S/. ${(cents / 100).toLocaleString("es-PE", { minimumFractionDigits: 2 })}`;
}

// Función para formatear fecha
function formatDate(date: Date | null): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("es-PE");
}

// GET - Exportar liquidación a Excel
export async function GET(request: NextRequest, { params }: Props) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    // Obtener liquidación completa
    const liquidation = await prisma.caseLiquidation.findUnique({
      where: { id },
      include: {
        case: {
          select: {
            id: true,
            code: true,
            title: true,
          },
        },
        arbitratorFees: {
          orderBy: { createdAt: "asc" },
        },
        adminPayments: {
          orderBy: { createdAt: "asc" },
        },
        installmentPlan: {
          include: {
            installments: {
              orderBy: { installmentNumber: "asc" },
            },
          },
        },
      },
    });

    if (!liquidation) {
      return NextResponse.json(
        { error: "Liquidación no encontrada" },
        { status: 404 }
      );
    }

    // Crear libro de Excel
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "CAARD";
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet("Liquidación", {
      pageSetup: {
        orientation: "landscape",
        fitToPage: true,
        margins: {
          left: 0.5, right: 0.5, top: 0.5, bottom: 0.5,
          header: 0.3, footer: 0.3,
        },
      },
    });

    // Estilos
    const headerStyle: Partial<ExcelJS.Style> = {
      font: { bold: true, size: 11, color: { argb: "FFFFFFFF" } },
      alignment: { horizontal: "center", vertical: "middle" },
      fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF0B2A5B" } },
    };

    const subHeaderStyle: Partial<ExcelJS.Style> = {
      font: { bold: true, size: 10, color: { argb: "FFFFFFFF" } },
      fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFD66829" } },
      alignment: { horizontal: "center", vertical: "middle" },
    };

    const greenStyle: Partial<ExcelJS.Style> = {
      fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF00B050" } },
    };

    const yellowStyle: Partial<ExcelJS.Style> = {
      fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFF00" } },
    };

    const redStyle: Partial<ExcelJS.Style> = {
      fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFFF0000" } },
      font: { color: { argb: "FFFFFFFF" } },
    };

    // Configurar anchos de columna
    worksheet.columns = [
      { width: 12 }, // A
      { width: 15 }, // B
      { width: 15 }, // C
      { width: 15 }, // D
      { width: 15 }, // E
      { width: 15 }, // F
      { width: 15 }, // G
      { width: 15 }, // H
      { width: 15 }, // I
      { width: 15 }, // J
      { width: 15 }, // K
      { width: 15 }, // L
    ];

    let row = 1;

    // === ENCABEZADO ===
    worksheet.mergeCells(`A${row}:D${row}`);
    worksheet.getCell(`A${row}`).value = "CENTRO DE ADMINISTRACIÓN DE ARBITRAJES Y RESOLUCIÓN DE DISPUTAS";
    worksheet.getCell(`A${row}`).font = { bold: true, size: 12 };

    row++;

    // Partes
    worksheet.mergeCells(`A${row}:L${row}`);
    worksheet.getCell(`A${row}`).value = `DEMANDANTE (DTE): ${liquidation.claimantName}`;
    worksheet.getCell(`A${row}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF00B0F0" } };

    row++;

    worksheet.mergeCells(`A${row}:L${row}`);
    worksheet.getCell(`A${row}`).value = `DEMANDADO (DDO): ${liquidation.respondentName}`;
    worksheet.getCell(`A${row}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFF00" } };

    row += 2;

    // Número de expediente
    worksheet.mergeCells(`A${row}:L${row}`);
    worksheet.getCell(`A${row}`).value = `Expediente N° ${liquidation.case.code}`;
    worksheet.getCell(`A${row}`).font = { bold: true, size: 14 };
    worksheet.getCell(`A${row}`).alignment = { horizontal: "center" };
    worksheet.getCell(`A${row}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0B2A5B" } };
    worksheet.getCell(`A${row}`).font = { bold: true, color: { argb: "FFFFFFFF" }, size: 14 };

    row += 2;

    // === GASTOS ARBITRALES PRELIMINARES ===
    worksheet.mergeCells(`A${row}:L${row}`);
    worksheet.getCell(`A${row}`).value = "GASTOS ARBITRALES PRELIMINARES";
    Object.assign(worksheet.getCell(`A${row}`), subHeaderStyle);

    row++;

    // Encabezados de gastos preliminares
    worksheet.getCell(`A${row}`).value = "ARANCEL POR PRESENTACIÓN";
    worksheet.getCell(`B${row}`).value = "DTE";
    worksheet.getCell(`C${row}`).value = formatAmount(liquidation.presentationFeeCents);
    worksheet.getCell(`D${row}`).value = "I.G.V.";
    worksheet.getCell(`E${row}`).value = formatAmount(liquidation.presentationFeeIgvCents);
    worksheet.getCell(`F${row}`).value = liquidation.presentationFeePaidAt ? "P" : "";
    if (liquidation.presentationFeePaidAt && greenStyle.fill) {
      worksheet.getCell(`F${row}`).fill = greenStyle.fill;
    }
    worksheet.getCell(`G${row}`).value = liquidation.presentationFeeInvoiceDate
      ? `F.E con fecha ${formatDate(liquidation.presentationFeeInvoiceDate)}`
      : "";

    row += 2;

    // === LIQUIDACIÓN PRINCIPAL ===
    worksheet.mergeCells(`A${row}:L${row}`);
    worksheet.getCell(`A${row}`).value = "LIQUIDACIÓN";
    Object.assign(worksheet.getCell(`A${row}`), subHeaderStyle);

    row++;

    // Encabezados de honorarios
    worksheet.getCell(`A${row}`).value = "HONORARIOS ARBITRALES";
    worksheet.mergeCells(`A${row}:F${row}`);
    worksheet.getCell(`G${row}`).value = "GASTOS ADMINISTRATIVOS";
    worksheet.mergeCells(`G${row}:L${row}`);

    row++;

    // Si hay árbitros
    if (liquidation.arbitratorFees.length > 0) {
      // Encabezados por árbitro
      liquidation.arbitratorFees.forEach((fee, index) => {
        const startCol = index === 0 ? "A" : "D";

        worksheet.getCell(`${startCol}${row}`).value = fee.arbitratorName.toUpperCase();
        worksheet.getCell(`${startCol}${row}`).font = { bold: true };
      });

      // Totales por parte para gastos admin
      const totalAdminDte = liquidation.adminPayments
        .filter(p => p.payer === "DTE" || p.payer === "BOTH")
        .reduce((sum, p) => sum + (p.payer === "BOTH" ? p.totalCents / 2 : p.totalCents), 0);

      worksheet.getCell(`G${row}`).value = formatAmount(totalAdminDte) + " más I.G.V.";

      row++;

      // Montos DTE/DDO por árbitro
      worksheet.getCell(`A${row}`).value = "DTE";
      worksheet.getCell(`B${row}`).value = "DDO";

      liquidation.arbitratorFees.forEach((fee) => {
        // Los montos son iguales para DTE y DDO
        const amountText = `${formatAmount(fee.netAmountCents)} Netos + 8% (${formatAmount(fee.retentionCents)})`;
        // Esto se muestra de manera simplificada
      });

      row++;

      // Estados de pago R.E - Mostrar estado del último árbitro
      const lastFee = liquidation.arbitratorFees[liquidation.arbitratorFees.length - 1];
      if (lastFee) {
        worksheet.getCell(`A${row}`).value = lastFee.dteStatus === "PAID" ? "R.E" : "";
        worksheet.getCell(`B${row}`).value = lastFee.ddoStatus === "PAID" ? "R.E" : "";
      }
    }

    row += 2;

    // === ADMINISTRACIÓN DE PAGOS ===
    worksheet.mergeCells(`A${row}:L${row}`);
    worksheet.getCell(`A${row}`).value = "ADMINISTRACIÓN DE PAGOS";
    Object.assign(worksheet.getCell(`A${row}`), subHeaderStyle);

    row++;

    // Encabezados de tabla de pagos
    worksheet.getCell(`A${row}`).value = "";
    worksheet.mergeCells(`A${row}:F${row}`);
    worksheet.getCell(`A${row}`).value = "DEMANDANTE (DTE)";
    worksheet.getCell(`G${row}`).value = "";
    worksheet.mergeCells(`G${row}:L${row}`);

    row++;

    worksheet.getCell(`A${row}`).value = "Fecha";
    worksheet.getCell(`B${row}`).value = "Honorarios arbitrales";
    worksheet.getCell(`C${row}`).value = "I.R.";
    worksheet.getCell(`D${row}`).value = "Emisión";
    worksheet.getCell(`E${row}`).value = "Fecha";
    worksheet.getCell(`F${row}`).value = "Gastos administrativos";
    worksheet.getCell(`G${row}`).value = "I.G.V.";
    worksheet.getCell(`H${row}`).value = "Emisión";

    // Aplicar estilo de encabezado
    for (let col = 1; col <= 8; col++) {
      const cell = worksheet.getCell(row, col);
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0B2A5B" } };
      cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 9 };
      cell.alignment = { horizontal: "center" };
    }

    row++;

    // Filas de pagos de honorarios
    liquidation.arbitratorFees.forEach((fee) => {
      if (fee.dtePaidAt) {
        worksheet.getCell(`A${row}`).value = formatDate(fee.dtePaidAt);
        worksheet.getCell(`B${row}`).value = `Pago por los honorarios arbitrales al árbitro ${fee.arbitratorName} por el monto de ${formatAmount(fee.grossAmountCents)}`;
        worksheet.getCell(`C${row}`).value = formatAmount(fee.retentionCents);
        worksheet.getCell(`D${row}`).value = fee.dteReceiptNumber ? `R.H. con fecha ${formatDate(fee.dteReceiptDate)}` : "";
        row++;
      }
    });

    // Filas de pagos administrativos
    liquidation.adminPayments.forEach((payment) => {
      if (payment.paidAt) {
        worksheet.getCell(`E${row}`).value = formatDate(payment.paidAt);
        worksheet.getCell(`F${row}`).value = payment.concept;
        worksheet.getCell(`G${row}`).value = formatAmount(payment.igvCents);
        worksheet.getCell(`H${row}`).value = payment.invoiceNumber || "";
        row++;
      }
    });

    row += 2;

    // === ESTADO DEL PROCESO ===
    if (liquidation.processStatus === "LAUDADO") {
      worksheet.mergeCells(`A${row}:L${row}`);
      worksheet.getCell(`A${row}`).value = `PROCESO LAUDADO con fecha ${formatDate(liquidation.awardDate)}`;
      worksheet.getCell(`A${row}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF00B050" } };
      worksheet.getCell(`A${row}`).font = { bold: true };
      worksheet.getCell(`A${row}`).alignment = { horizontal: "center" };
    }

    row += 2;

    // === FRACCIONAMIENTO ===
    if (liquidation.installmentPlan) {
      worksheet.mergeCells(`A${row}:L${row}`);
      worksheet.getCell(`A${row}`).value = `FRACCIONAMIENTO (Aprobado mediante ${liquidation.installmentPlan.approvalMethod}.....)`;
      Object.assign(worksheet.getCell(`A${row}`), subHeaderStyle);

      row++;

      // Encabezados de cuotas
      worksheet.getCell(`A${row}`).value = "Cuotas";
      worksheet.getCell(`B${row}`).value = "Honorarios arbitrales";
      worksheet.getCell(`C${row}`).value = "I.R.";
      worksheet.getCell(`D${row}`).value = "Emisión";
      worksheet.getCell(`E${row}`).value = "Gastos administrativos";
      worksheet.getCell(`F${row}`).value = "I.G.V.";
      worksheet.getCell(`G${row}`).value = "Emisión";

      row++;

      // Cuotas
      liquidation.installmentPlan.installments.forEach((installment) => {
        worksheet.getCell(`A${row}`).value = `Cuota ${installment.installmentNumber}`;
        worksheet.getCell(`B${row}`).value = formatAmount(installment.arbitratorFeeCents);
        worksheet.getCell(`C${row}`).value = formatAmount(installment.arbitratorRetentionCents);
        worksheet.getCell(`D${row}`).value = installment.arbitratorReceiptNumber || "";
        worksheet.getCell(`E${row}`).value = formatAmount(installment.adminFeeCents);
        worksheet.getCell(`F${row}`).value = formatAmount(installment.adminIgvCents);
        worksheet.getCell(`G${row}`).value = installment.adminInvoiceNumber || "";
        row++;
      });
    }

    row += 2;

    // === LEYENDA ===
    worksheet.getCell(`J${row}`).value = "LEYENDA";
    worksheet.getCell(`J${row}`).font = { bold: true };

    row++;
    worksheet.getCell(`J${row}`).value = "PAGADO";
    worksheet.getCell(`K${row}`).value = "P";
    if (greenStyle.fill) {
      worksheet.getCell(`K${row}`).fill = greenStyle.fill;
    }

    row++;
    worksheet.getCell(`J${row}`).value = "PAGO PARCIAL";
    worksheet.getCell(`K${row}`).value = "P.P";

    row++;
    worksheet.getCell(`J${row}`).value = "FALTA ACREDITAR";
    worksheet.getCell(`K${row}`).value = "F.A";
    if (redStyle.fill) {
      worksheet.getCell(`K${row}`).fill = redStyle.fill;
    }
    if (redStyle.font) {
      worksheet.getCell(`K${row}`).font = redStyle.font;
    }

    row++;
    worksheet.getCell(`J${row}`).value = "IMPUESTO A LA RENTA";
    worksheet.getCell(`K${row}`).value = "I.R.";

    row++;
    worksheet.getCell(`J${row}`).value = "IMPUESTO GENERAL A LAS VENTAS";
    worksheet.getCell(`K${row}`).value = "I.G.V.";

    row++;
    worksheet.getCell(`J${row}`).value = "FACTURA EMITIDA";
    worksheet.getCell(`K${row}`).value = "F.E";

    row++;
    worksheet.getCell(`J${row}`).value = "RECIBO EMITIDO";
    worksheet.getCell(`K${row}`).value = "R.E";

    row++;
    worksheet.getCell(`J${row}`).value = "CADA PARTE";
    worksheet.getCell(`K${row}`).value = "C/P";

    row++;
    worksheet.getCell(`J${row}`).value = "CADA ÁRBITRO";
    worksheet.getCell(`K${row}`).value = "C/A";

    // Generar buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Retornar como archivo descargable
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="Liquidacion_${liquidation.case.code.replace(/\//g, "_")}.xlsx"`,
      },
    });
  } catch (error) {
    console.error("Error exporting liquidation:", error);
    return NextResponse.json(
      { error: "Error al exportar liquidación" },
      { status: 500 }
    );
  }
}
