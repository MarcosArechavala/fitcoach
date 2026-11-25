# FITCOACH — Guía Oficial de Despliegue a Producción y Seguridad

Documento de referencia para el despliegue del sistema **FITCOACH** en entornos de producción, cumpliendo con buenas prácticas de seguridad, arquitectura desacoplada y normativa argentina de protección de datos (Ley 25.326).

---

## 1. Arquitectura Recomendada

| Componente | Proveedor Recomendado | Configuración Clave |
| :--- | :--- | :--- |
| **Base de Datos** | **Neon PostgreSQL** | Región `sa-east-1` (São Paulo) para mínima latencia con Argentina. Modo conexión con pooler y `sslmode=require`. |
| **Backend API** | **Render / Railway / VPS** | Node.js 22+, `trust proxy: 1`, HTTPS estricto, variables de entorno protegidas. |
| **Frontend Web** | **Vercel / Cloudflare Pages** | Build estático Vite (`dist/`), SPA rewrites mediante `vercel.json` y cabeceras de seguridad HTTP. |

---

## 2. Variables de Entorno de Producción

### Backend (`fitcoach/backend`)
Configurar estas variables en el panel de tu hosting (Render, Railway o `.env` en VPS):

```env
NODE_ENV=production
PORT=4000
FRONTEND_URL=https://tu-dominio.com.ar
DATABASE_URL="postgresql://USUARIO:PASSWORD@ep-xyz.sa-east-1.aws.neon.tech/neondb?sslmode=require"
JWT_SECRET="<GENERAR CON: openssl rand -hex 32>"
JWT_EXPIRES_IN="7d"
COOKIE_NAME="fitcoach_session"
```

### Frontend (`fitcoach/frontend`)
* Si se despliega con rewrite/proxy en el mismo dominio o subdominio: `VITE_API_URL=/api`.
* Si la API está en otro dominio sin proxy inverso: `VITE_API_URL=https://api.tu-dominio.com.ar/api`.

---

## 3. Despliegue Paso a Paso (PaaS: Vercel + Render + Neon)

### Fase A: Base de datos en Neon
1. Crear proyecto en [neon.tech](https://neon.tech) en la región **`sa-east-1` (São Paulo)**.
2. Copiar la connection string que contiene `sslmode=require`.

### Fase B: Backend en Render o Railway
1. Conectar el repositorio de GitHub.
2. Definir **Root Directory:** `fitcoach/backend`.
3. **Build Command:**
   ```bash
   npm install && npx prisma generate && npm run build
   ```
4. **Start Command:**
   ```bash
   npx prisma migrate deploy && npm start
   ```
5. Cargar las variables de entorno de producción listadas en la sección 2.
6. Copiar la URL pública del backend (ej. `https://fitcoach-api.onrender.com`).

### Fase C: Frontend en Vercel
1. Conectar el repositorio en [vercel.com](https://vercel.com).
2. **Root Directory:** `fitcoach/frontend`.
3. **Framework Preset:** `Vite`.
4. El archivo [vercel.json](file:///c:/Users/Usuario/personaltrainer/fitcoach/frontend/vercel.json) ya configurado se encarga de:
   * Servir la aplicación SPA (`index.html` para todas las rutas).
   * Agregar cabeceras de seguridad (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`).
   * *(Opcional)* Si querés que Vercel actúe de reverse-proxy para evitar problemas de CORS/cookies de terceros, agregá la regla en `vercel.json`:
     ```json
     {
       "source": "/api/:path*",
       "destination": "https://fitcoach-api.onrender.com/api/:path*"
     }
     ```

### Fase D: Creación del Entrenador Inicial
Una vez que el backend esté arriba y las migraciones aplicadas, creá la cuenta del entrenador administrador:
```bash
SEED_TRAINER_EMAIL="entrenador@tudominio.com.ar" SEED_TRAINER_PASSWORD="PasswordSegura2026!" npm run prisma:seed
```

---

## 4. Despliegue con Docker (Opción VPS / Servidor Propio)

Si preferís desplegar en un VPS (Hetzner, DigitalOcean, DonWeb):
1. Copiar la carpeta `fitcoach/` al servidor.
2. Ejecutar:
   ```bash
   docker compose up -d --build
   ```
3. Configurar Nginx / Caddy como proxy inverso con certificado SSL (Let's Encrypt / Certbot).

---

## 5. Auditoría de Seguridad y Cumplimiento Normativo (Ley 25.326)

- **Contraseñas y Hashing:** Hasheadas exclusivamente con `bcryptjs` con factor de coste 12.
- **Sesiones Seguras:** Almacenadas en cookies `HttpOnly`, con `Secure=true` forzado en producción y `SameSite=Lax`.
- **Tokens Temporales:** Invitaciones de alumnos y recuperación de contraseña se guardan únicamente como hash criptográfico `SHA-256` con ventana de caducidad.
- **Control de Acceso Horizontal (IDOR):** Middleware `requireStudentAccess` asegura que un alumno jamás acceda a mediciones, rutinas o información de otro alumno.
- **Rate Limiting:** Protección anti brute-force en `/api/auth/login`, `/api/auth/forgot-password` y `POST /api/leads`.
- **Gestión de Secretos:** `.gitignore` en niveles raíz, backend y frontend previene la filtración de credenciales a Git. Archivos `.env.example` higienizados sin secretos reales.
