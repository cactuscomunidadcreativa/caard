# CAARD - Guía de Migración de Datos

## Descripción General

Esta carpeta contiene las plantillas CSV necesarias para migrar datos al sistema CAARD. Cada archivo representa una tabla de la base de datos y debe completarse siguiendo el formato especificado.

## Archivos de Migración

| # | Archivo | Descripción | Dependencias |
|---|---------|-------------|--------------|
| 01 | `01_centers.csv` | Centros de Arbitraje | Ninguna |
| 02 | `02_users.csv` | Usuarios del sistema | Centers |
| 03 | `03_arbitrator_registry.csv` | Registro de Árbitros | Users, Centers |
| 04 | `04_arbitration_types.csv` | Tipos de Arbitraje | Centers |
| 05 | `05_cases.csv` | Expedientes/Casos | Centers, ArbitrationTypes |
| 06 | `06_case_members.csv` | Miembros del Caso | Cases, Users |
| 07 | `07_case_lawyers.csv` | Abogados del Caso | Cases, Users, CaseMembers |
| 08 | `08_case_documents.csv` | Documentos | Cases, CaseFolders, Users |
| 09 | `09_payments.csv` | Pagos | Cases |
| 10 | `10_payment_orders.csv` | Órdenes de Pago | Cases |
| 11 | `11_case_deadlines.csv` | Plazos | Cases |
| 12 | `12_case_hearings.csv` | Audiencias | Cases |
| 13 | `13_holidays.csv` | Feriados | Centers (opcional) |
| 14 | `14_fee_configuration.csv` | Configuración de Tarifas | Centers |
| 15 | `15_case_notes.csv` | Notas del Caso | Cases, Users |
| 16 | `16_case_folders.csv` | Carpetas del Caso | Cases |

## Orden de Importación

⚠️ **IMPORTANTE**: Los archivos deben importarse en el orden numérico indicado debido a las dependencias entre tablas.

```
1. Centers (Centros)
2. Users (Usuarios)
3. ArbitratorRegistry (Registro de Árbitros)
4. ArbitrationTypes (Tipos de Arbitraje)
5. Cases (Expedientes)
6. CaseFolders (Carpetas)
7. CaseMembers (Miembros)
8. CaseLawyers (Abogados)
9. CaseDocuments (Documentos)
10. PaymentOrders (Órdenes de Pago)
11. Payments (Pagos)
12. CaseDeadlines (Plazos)
13. CaseHearings (Audiencias)
14. CaseNotes (Notas)
15. Holidays (Feriados)
16. FeeConfiguration (Tarifas)
```

## Formato de Datos

### Campos Obligatorios
Los campos marcados con `*` en las cabeceras son obligatorios y no pueden estar vacíos.

### Formato de Fechas
- Usar formato ISO 8601: `YYYY-MM-DD` o `YYYY-MM-DDTHH:MM:SS`
- Ejemplos: `2024-01-15` o `2024-01-15T10:30:00`

### Formato de Montos
- Todos los montos están en **céntimos** (cents)
- `50000` = S/. 500.00 o $500.00
- `1500000` = S/. 15,000.00

### IDs
- Usar IDs descriptivos temporales para referencia cruzada
- Ejemplo: `CASO_001`, `USER_001`, `DOC_001`
- El sistema generará IDs únicos (CUID) durante la importación

### Booleanos
- Usar: `true` o `false` (minúsculas)

### Arrays
- Separar valores con coma: `Comercial,Civil,Construcción`

### Campos Vacíos
- Dejar en blanco (no usar "null", "N/A", etc.)

## Valores de Enumeración

### Roles de Usuario
| Valor | Descripción |
|-------|-------------|
| `SUPER_ADMIN` | Administrador del sistema completo |
| `ADMIN` | Administrador general del centro |
| `CENTER_STAFF` | Personal del centro |
| `SECRETARIA` | Secretaría arbitral |
| `ARBITRO` | Árbitro |
| `ABOGADO` | Abogado |
| `DEMANDANTE` | Parte demandante |
| `DEMANDADO` | Parte demandada |

### Estados del Caso
| Valor | Descripción |
|-------|-------------|
| `DRAFT` | Borrador |
| `SUBMITTED` | Presentado |
| `UNDER_REVIEW` | En Revisión |
| `OBSERVED` | Observado |
| `ADMITTED` | Admitido |
| `REJECTED` | Rechazado |
| `IN_PROCESS` | En Trámite |
| `AWAITING_PAYMENT` | Pendiente de Pago |
| `PAYMENT_OVERDUE` | Pago Vencido |
| `SUSPENDED` | Suspendido |
| `CLOSED` | Cerrado |
| `ARCHIVED` | Archivado |

### Etapas Procesales
| Valor | Descripción |
|-------|-------------|
| `DEMANDA` | Etapa de demanda |
| `CONTESTACION` | Etapa de contestación |
| `RECONVENCION` | Etapa de reconvención |
| `PROBATORIA` | Etapa probatoria |
| `AUDIENCIA_PRUEBAS` | Audiencia de pruebas |
| `INFORMES_ORALES` | Informes orales |
| `LAUDO` | Etapa de laudo |

### Estados de Pago
| Valor | Descripción |
|-------|-------------|
| `REQUIRED` | Requerido |
| `PENDING` | Pendiente |
| `CONFIRMED` | Confirmado |
| `FAILED` | Fallido |
| `CANCELLED` | Cancelado |
| `OVERDUE` | Vencido |
| `REFUNDED` | Reembolsado |

### Estado del Árbitro
| Valor | Descripción |
|-------|-------------|
| `PENDING_APPROVAL` | Pendiente de aprobación |
| `ACTIVE` | Activo |
| `SUSPENDED` | Suspendido |
| `SANCTIONED` | Sancionado |
| `RETIRED` | Retirado |
| `REJECTED` | Rechazado |

## Validaciones

El script de migración validará:

1. **Integridad referencial**: Los IDs referenciados deben existir
2. **Campos obligatorios**: No pueden estar vacíos
3. **Formatos**: Fechas, montos, booleanos
4. **Valores de enumeración**: Deben coincidir exactamente
5. **Unicidad**: Códigos y emails únicos donde corresponda

## Proceso de Migración

### 1. Preparación
```bash
# Verificar estructura de archivos
ls -la scripts/migration/
```

### 2. Validación
```bash
# Ejecutar validación sin importar
npm run migration:validate
```

### 3. Importación
```bash
# Ejecutar migración completa
npm run migration:import

# O importar tabla específica
npm run migration:import -- --table=cases
```

### 4. Verificación
```bash
# Verificar datos importados
npm run migration:verify
```

## Manejo de Errores

Si hay errores durante la importación:

1. Revisar el log de errores generado
2. Corregir los datos en los archivos CSV
3. Ejecutar la validación nuevamente
4. Reintentar la importación

## Contraseñas

Para el campo `passwordHash` en usuarios:
- Dejar el marcador `[HASH_BCRYPT]`
- El script generará un hash con una contraseña temporal
- Los usuarios deberán cambiar su contraseña al primer inicio de sesión

## Soporte

Para dudas sobre la migración:
- Email: soporte@caard.pe
- Documentación técnica: docs/migration.md

---

Última actualización: Enero 2026
