# FullStackBlog - Aplicación de Actualización Masiva para Bitrix24

Una aplicación web fullstack para actualizar registros en Bitrix24 de forma masiva mediante archivos CSV/Excel.

## 🚀 Características

- **Interfaz moderna**: React + TypeScript con Tailwind CSS y Radix UI
- **Backend robusto**: Node.js + Express con validación de datos
- **Procesamiento de archivos**: Soporte para CSV y Excel (.xlsx, .xls)
- **Integración Bitrix24**: Webhooks para búsqueda y actualización de registros
- **Persistencia flexible**: Almacenamiento en memoria o archivos JSON
- **Seguridad**: Validación de tokens y dominios permitidos

## 📁 Estructura del Proyecto

```
FullStackBlog/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Componentes UI
│   │   ├── hooks/         # Custom hooks
│   │   ├── lib/           # Utilidades y APIs
│   │   └── pages/         # Páginas de la aplicación
├── server/                # Backend Express
│   ├── routes.ts          # Endpoints de la API
│   ├── storage.ts         # Sistema de almacenamiento
│   └── index.ts           # Servidor principal
├── shared/                # Esquemas compartidos
└── data/                  # Archivos de persistencia (si se usa FileStorage)
```

## 🛠️ Tecnologías

### Frontend
- **React 18** con TypeScript
- **Vite** para build y desarrollo
- **Tailwind CSS** para estilos
- **Radix UI** para componentes accesibles
- **React Hook Form** para formularios
- **TanStack Query** para manejo de estado

### Backend
- **Node.js** con Express
- **TypeScript** para type safety
- **Multer** para upload de archivos
- **Papa Parse** para CSV
- **XLSX** para Excel
- **Zod** para validación

## ⚙️ Configuración

### Variables de Entorno

```bash
# Obligatorias
PORT=5000                                    # Puerto del servidor
APP_SECRET_TOKEN=tu_token_secreto           # Token de seguridad
BITRIX_WEBHOOK_URL=https://{domain}.bitrix24.com/rest/1/webhook_key/

# Opcionales
ALLOWED_DOMAINS=dominio1.bitrix24.com,dominio2.bitrix24.com
NODE_ENV=production
USE_FILE_STORAGE=true                       # Forzar uso de FileStorage
```

### Opciones de Almacenamiento

#### 1. MemStorage (Por defecto en desarrollo)
- Almacenamiento en memoria
- Datos se pierden al reiniciar
- Ideal para desarrollo y pruebas

#### 2. FileStorage (Por defecto en producción)
- Almacenamiento en archivos JSON
- Datos persistentes entre reinicios
- Archivos guardados en `/data/`
- Ideal para producción

**Cambiar tipo de almacenamiento:**
```bash
# Usar FileStorage en desarrollo
USE_FILE_STORAGE=true npm run dev

# Usar MemStorage en producción
NODE_ENV=production USE_FILE_STORAGE=false npm start
```

## 🚀 Instalación y Uso

### Desarrollo Local

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# La aplicación estará en http://localhost:5000
```

### Producción

```bash
# Build del proyecto
npm run build

# Ejecutar en producción
npm start
```

## 📊 Flujo de Trabajo

1. **Subir archivo**: CSV o Excel con datos a actualizar
2. **Configurar**: Seleccionar tipo de registro y columnas clave
3. **Procesar**: Búsqueda automática en Bitrix24
4. **Revisar**: Ver resultados y seleccionar acciones
5. **Ejecutar**: Actualizar registros seleccionados

## 🔒 Seguridad

- **Validación de token**: Todas las peticiones requieren `APP_SECRET_TOKEN`
- **Dominios permitidos**: Restricción por `ALLOWED_DOMAINS`
- **Rate limiting**: Límite de 2 peticiones por segundo a Bitrix24
- **Validación de archivos**: Tamaño máximo y formato verificado

## 🚀 Deploy en Render

### Configuración en Render

1. **Build Command**: `npm run build`
2. **Start Command**: `npm start`
3. **Environment Variables**:
   ```bash
   NODE_ENV=production
   APP_SECRET_TOKEN=tu_token_secreto
   BITRIX_WEBHOOK_URL=https://{domain}.bitrix24.com/rest/1/webhook_key/
   ALLOWED_DOMAINS=tu-dominio.bitrix24.com
   ```

### Ventajas del FileStorage en Render

- ✅ **Persistencia**: Datos sobreviven reinicios
- ✅ **Sin base de datos**: No requiere PostgreSQL
- ✅ **Simplicidad**: Archivos JSON fáciles de debuggear
- ✅ **Escalabilidad**: Funciona con múltiples instancias

## 📝 API Endpoints

### POST `/api/validate-security`
Valida token y dominio de seguridad.

### POST `/api/upload`
Sube y procesa archivo CSV/Excel.

### POST `/api/process`
Inicia procesamiento y búsqueda en Bitrix24.

### GET `/api/status/:sessionId`
Obtiene estado del procesamiento.

### POST `/api/execute`
Ejecuta actualizaciones seleccionadas.

### GET `/api/results/:sessionId`
Obtiene resultados completos.

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📄 Licencia

MIT License - ver archivo LICENSE para detalles.
