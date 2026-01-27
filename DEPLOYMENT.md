# CAARD - Deployment Guide

## 🚀 Despliegue en Vercel + Neon PostgreSQL

Esta guía te ayudará a desplegar CAARD en producción usando Vercel y Neon.

---

## 📋 Requisitos Previos

1. Cuenta en [Vercel](https://vercel.com)
2. Cuenta en [Neon](https://neon.tech)
3. Node.js 18+ instalado
4. Git instalado

---

## 🗄️ Paso 1: Configurar Neon PostgreSQL

### 1.1 Crear Proyecto en Neon

1. Ve a [console.neon.tech](https://console.neon.tech)
2. Click en "Create Project"
3. Nombre del proyecto: `caard-production`
4. Región: Selecciona la más cercana (ej: `US East (Ohio)`)
5. Click "Create Project"

### 1.2 Obtener Connection String

1. En el dashboard del proyecto, ve a "Connection Details"
2. Copia el **Connection string** (se ve así):
   ```
   postgresql://neondb_owner:xxxxxxxx@ep-xxxxx-xxxxx.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

### 1.3 Configurar Base de Datos

Opción A - Usando el script:
```bash
export DATABASE_URL='tu-connection-string'
./scripts/setup-neon.sh
```

Opción B - Manual:
```bash
# Establecer variable de entorno
export DATABASE_URL='tu-connection-string'

# Generar cliente Prisma
npx prisma generate

# Sincronizar esquema con la base de datos
npx prisma db push

# Poblar con datos iniciales (opcional pero recomendado)
npx prisma db seed
```

### 1.4 Verificar Conexión

```bash
npx prisma studio
```

Esto abrirá una GUI para verificar que la base de datos está configurada correctamente.

---

## ☁️ Paso 2: Configurar Vercel

### 2.1 Instalar Vercel CLI

```bash
npm i -g vercel
```

### 2.2 Login en Vercel

```bash
vercel login
```

### 2.3 Vincular Proyecto

```bash
cd /ruta/a/caard
vercel link
```

### 2.4 Configurar Variables de Entorno

En el dashboard de Vercel (vercel.com):

1. Ve a tu proyecto → Settings → Environment Variables
2. Agrega las siguientes variables:

#### Variables Requeridas:

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | Connection string de Neon | `postgresql://...` |
| `NEXTAUTH_SECRET` | Secret para autenticación | Genera con: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | URL de tu dominio | `https://tu-dominio.vercel.app` |

#### Variables Opcionales (según servicios que uses):

| Variable | Servicio |
|----------|----------|
| `RESEND_API_KEY` | Email (Resend) |
| `TWILIO_ACCOUNT_SID` | SMS/WhatsApp |
| `TWILIO_AUTH_TOKEN` | SMS/WhatsApp |
| `TWILIO_PHONE_NUMBER` | SMS |
| `CULQI_PUBLIC_KEY` | Pagos (Culqi) |
| `CULQI_SECRET_KEY` | Pagos (Culqi) |
| `OPENAI_API_KEY` | AI Assistant |
| `GOOGLE_CLIENT_ID` | OAuth Google |
| `GOOGLE_CLIENT_SECRET` | OAuth Google |

---

## 🚀 Paso 3: Desplegar

### Opción A - Usando el script:
```bash
./scripts/deploy-vercel.sh
```

### Opción B - Manual:

```bash
# Preview (staging)
vercel

# Producción
vercel --prod
```

### Opción C - CI/CD Automático

Conecta tu repositorio de GitHub a Vercel:
1. Ve a vercel.com → Add New Project
2. Importa desde GitHub
3. Vercel detectará Next.js automáticamente
4. Cada push a `main` desplegará automáticamente

---

## ✅ Paso 4: Verificar Deployment

### 4.1 Health Check

Visita: `https://tu-dominio.vercel.app/api/health`

Deberías ver:
```json
{
  "status": "healthy",
  "timestamp": "...",
  "checks": {
    "database": { "status": "ok", "latency": 45 },
    "memory": { "status": "ok" }
  }
}
```

### 4.2 Verificar Base de Datos

Visita: `https://tu-dominio.vercel.app/api/db/status` (requiere login admin)

### 4.3 Probar Login

1. Ve a `https://tu-dominio.vercel.app/login`
2. Usa las credenciales del seed:
   - Email: `admin@caard.pe`
   - Password: `Admin123!`

---

## 🔧 Mantenimiento

### Actualizar Schema de Base de Datos

```bash
# En desarrollo
npx prisma db push

# En producción (a través de Vercel)
# El build command ya incluye: prisma generate && next build
```

### Ver Logs

```bash
vercel logs
```

### Rollback

```bash
vercel rollback
```

---

## 🛡️ Seguridad en Producción

### Checklist:

- [ ] Cambiar contraseña del admin inicial
- [ ] Configurar dominio personalizado con SSL
- [ ] Habilitar 2FA en Vercel y Neon
- [ ] Configurar backups automáticos en Neon
- [ ] Revisar variables de entorno (no exponer secrets)
- [ ] Configurar rate limiting si es necesario
- [ ] Considerar Cloudflare para CDN/DDoS protection

### Configurar Cloudflare (Recomendado)

1. Ve a `/admin/settings/cloudflare`
2. Sigue la guía de configuración
3. Beneficios:
   - CDN global
   - Protección DDoS gratuita
   - SSL automático
   - Caché inteligente

---

## 📊 Monitoreo

### Site Health Dashboard

Ve a `/admin/reports/site-health` para ver:
- Estado de servicios
- Uso de almacenamiento
- Incidentes recientes
- Logs de errores

### Endpoints de Monitoreo

- `/api/health` - Health check público
- `/api/db/status` - Estado de la base de datos (admin)

---

## 🆘 Troubleshooting

### Error: Database Connection Failed

1. Verifica `DATABASE_URL` en Vercel
2. Asegúrate de incluir `?sslmode=require`
3. Verifica que la IP de Vercel no esté bloqueada en Neon

### Error: Build Failed

1. Ejecuta `npm run build` localmente
2. Revisa los logs de Vercel
3. Verifica que todas las dependencias estén en package.json

### Error: Authentication Failed

1. Verifica `NEXTAUTH_SECRET`
2. Verifica `NEXTAUTH_URL` (debe coincidir con tu dominio)
3. Si usas OAuth, verifica las URLs de callback

---

## 📞 Soporte

- **Vercel Docs**: https://vercel.com/docs
- **Neon Docs**: https://neon.tech/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **Next.js Docs**: https://nextjs.org/docs

---

## 🔄 Comandos Útiles

```bash
# Desarrollo
npm run dev

# Build local
npm run build

# Prisma Studio (GUI de base de datos)
npx prisma studio

# Generar cliente Prisma
npx prisma generate

# Push schema a BD
npx prisma db push

# Seed de datos
npx prisma db seed

# Deploy a Vercel
vercel --prod

# Ver logs de Vercel
vercel logs
```
