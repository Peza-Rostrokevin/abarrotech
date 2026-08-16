# AbarroTech

Aplicación web para crear y mostrar un catálogo digital de productos. Incluye catálogo público, panel de vendedores (CRUD de sus productos) y panel de administración.

## Stack

- **Frontend:** Angular 20 (web) — planificado: Ionic + Angular (móvil)
- **Backend:** Node.js + Express
- **Base de datos:** MongoDB Atlas
- **Autenticación:** JWT
- **Imágenes:** URL externa (Cloudinary u otro host de imágenes)

## Estructura

```
catalogo-digital/
├── backend/    # API REST (Express + Mongoose)
└── frontend/   # App Angular 20
```

## Ejecutar en desarrollo

### 1. Base de datos

Crea un cluster gratis en [MongoDB Atlas](https://www.mongodb.com/atlas) y copia la URI de conexión.

### 2. Backend

```bash
cd backend
cp .env.example .env   # edita con tu URI de MongoDB y un JWT_SECRET fuerte
npm install
npm run dev            # http://localhost:5000
```

### 3. Frontend

```bash
cd frontend
npm install
ng serve              # http://localhost:4200
```

## Usuarios

- **Registro público:** crea cuentas con rol `vendedor` automáticamente.
- **Administrador:** el primer admin debe crearse manualmente en la BD (cambiar `role: "admin"` de un usuario) o directamente con el endpoint `/api/auth/register` y luego actualizar el rol en MongoDB.

### Crear el admin (una sola vez)

```javascript
// En MongoDB Atlas (Data Explorer) o mongosh:
db.users.updateOne({ email: "tucorreo@ejemplo.com" }, { $set: { role: "admin" } });
```

## Roles

| Rol | Permisos |
|-----|----------|
| `vendedor` | Crear/editar/eliminar **solo sus** productos, ver su lista |
| `admin` | Gestionar vendedores, ver todos los productos, editar/eliminar cualquier producto |

## Endpoints API

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| POST | `/api/auth/register` | Público | Registrar vendedor |
| POST | `/api/auth/login` | Público | Iniciar sesión |
| GET | `/api/auth/me` | Autenticado | Perfil actual |
| GET | `/api/products` | Público | Listar catálogo |
| GET | `/api/products/mine` | Vendedor | Mis productos |
| POST | `/api/products` | Vendedor | Crear producto |
| PUT | `/api/products/:id` | Dueño/Admin | Editar producto |
| DELETE | `/api/products/:id` | Dueño/Admin | Eliminar producto |
| GET | `/api/admin/users` | Admin | Listar vendedores |
| GET | `/api/admin/products` | Admin | Ver todos los productos |
| DELETE | `/api/admin/users/:id` | Admin | Eliminar vendedor + sus productos |

## Despliegue gratuito

### Backend → Render.com

1. Sube el backend a un repo de GitHub.
2. En [Render](https://render.com) crea un **Web Service** conectado al repo (ruta `backend/`).
3. Configura las variables de entorno: `MONGODB_URI`, `JWT_SECRET`.
4. El servicio se "duerme" tras inactividad (~15 min) y se despierta con el primer request (puede tardar ~30-60s).

### Frontend → Netlify

1. Sube el frontend a GitHub.
2. En [Netlify](https://netlify.com) crea un sitio desde el repo.
3. Build command: `npm run build` | Publish directory: `dist/frontend/browser` (ya configurado en `netlify.toml`).
4. Edita `src/environments/environment.ts` con la URL de tu API en Render y sube de nuevo.

### Dominio

- Subdominio gratuito: `tusitio.netlify.app`
- Dominio gratis: Freenom (.tk, .ml) — conéctalo como dominio personalizado en Netlify.

## Imágenes

La app pide una **URL de imagen** al crear un producto. Para subir imágenes gratis:

- [Cloudinary](https://cloudinary.com) — 25 GB gratis. Sube la imagen y copia la URL.
- En la app móvil futura (Ionic) se puede usar la cámara y subir directo a Cloudinary con su SDK.

## Futuro: App móvil (Ionic)

1. `ionic start app-movil --type=angular`
2. Reutilizar `src/app/models`, `core/services` y `core/interceptors` del frontend web.
3. Pantallas: Login + Mis Productos (formulario con foto desde cámara).
