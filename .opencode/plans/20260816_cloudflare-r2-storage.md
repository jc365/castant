# Plan: Integrar Cloudflare R2 como almacenamiento de vídeos

## Contexto

Actualmente los vídeos se guardan en `backend/uploads/videos/` con multer disk storage. Esto funciona en desarrollo pero no es escalable: no persiste entre despliegues, no escala horizontalmente, y no es adecuado para producción. Cloudflare R2 ofrece almacenamiento S3-compatible sin costos de egress.

## Archivos a crear

### 1. `backend/src/infrastructure/storage/r2Client.ts` (nuevo)

Cliente S3 configurado para R2:
- Region `auto`, endpoint `https://{ACCOUNT_ID}.r2.cloudflarestorage.com`
- Credentials desde env vars: `CLOUDFLARE_R2_ACCOUNT_ID`, `CLOUDFLARE_R2_ACCESS_KEY_ID`, `CLOUDFLARE_R2_SECRET_ACCESS_KEY`
- Bucket name: `CLOUDFLARE_R2_BUCKET`

### 2. `backend/src/infrastructure/storage/storageService.ts` (nuevo)

Servicio de almacenamiento con interfaz unificada:

```typescript
class StorageService {
  isR2Configured(): boolean
  async uploadFile(key: string, buffer: Buffer, contentType: string): Promise<string>
  // Returns: R2 key si está configurado, ruta local si no
  getFileUrl(key: string, expiresIn?: number): string
  // Returns: presigned URL si R2, ruta local si no
  async deleteFile(key: string): Promise<void>
}
```

- Lógica dual: si `CLOUDFLARE_R2_BUCKET` está configurado → R2, si no → fallback local
- Upload a R2: `PutObjectCommand` con el buffer
- Presigned URL: `getSignedUrl` con `GetObjectCommand`, expires por defecto 1h
- Delete: `DeleteObjectCommand`
- Fallback local: escribe a `uploads/videos/`, retorna `/uploads/videos/{key}`

## Archivos a modificar

### 3. `backend/src/infrastructure/storage/videoUpload.ts`

Cambiar de `multer.diskStorage` a `multer.memoryStorage`:
- El archivo se guarda en `req.file.buffer` en memoria
- Se mantiene el fileFilter y limits (100MB, MIME types)
- El buffer se pasa al StorageService para subir a R2 o disco

### 4. `backend/src/infrastructure/api/v1/routes.ts`

Modificar endpoint `POST /submissions` (línea 401):
- Importar `StorageService`
- Cuando `req.file` existe: usar `storageService.uploadFile()` en vez de construir URL local manualmente
- El `finalVideoUrl` será la ruta/key retornada por StorageService
- Para URLs externas (YouTube, etc.) se mantiene sin cambios

### 5. `backend/package.json`

Agregar dependencias:
```json
"@aws-sdk/client-s3": "^3.x",
"@aws-sdk/s3-request-presigner": "^3.x"
```

### 6. `backend/.env.example`

Agregar variables:
```
CLOUDFLARE_R2_ACCOUNT_ID=
CLOUDFLARE_R2_ACCESS_KEY_ID=
CLOUDFLARE_R2_SECRET_ACCESS_KEY=
CLOUDFLARE_R2_BUCKET=
```

## Flujo de upload

```
Actor sube vídeo
  → POST /submissions (multipart con campo 'video')
  → videoUpload.single('video') → multer memoryStorage → req.file.buffer
  → routes.ts: StorageService.uploadFile(key, buffer, contentType)
  → Si R2 configurado: PutObjectCommand → R2 bucket
  → Si no: writeFileSync → backend/uploads/videos/
  → finalVideoUrl = key (R2) o /uploads/videos/filename (local)
  → submitVideoUseCase.execute({ videoUrl: finalVideoUrl })
  → Respuesta con videoUrl
```

## Decisiones de diseño

1. **memoryStorage en multer**: Necesario porque R2 recibe buffers, no streams de disco. El límite de 100MB previene memory issues.

2. **Fallback automático**: Si no hay env vars de R2, funciona igual que antes con almacenamiento local. No se rompe el dev environment.

3. **Key naming para R2**: `{timestamp}-{random}.{ext}` (mismo formato que actual) bajo prefijo `videos/` para organizar el bucket.

4. **Presigned URLs**: Para acceso a vídeos en R2. El endpoint GET de submissions podría necesitar generar presigned URLs bajo demanda, pero por ahora se almacena la key y el frontend puede resolverla.

5. **No se modifica el esquema de BD**: El campo `videoUrl` en Submission almacena la key de R2 o la ruta local. La resolución a URL accesible se hace en el servicio.

## Impacto

- **Backend**: Solo changes en storage layer, routes, y package.json
- **Frontend**: Sin cambios (recibe `videoUrl` como antes)
- **Tests existentes**: Deben seguir pasando (fallback local mantiene compatibilidad)
- **Orchestration**: Sin cambios (usa `video_url` del webhook)

## Verificación

1. `cd backend && npm install` — instalar dependencias
2. `cd backend && npx tsc --noEmit` — typecheck
3. `npm test` — tests unitarios (deben pasar con fallback local)
4. `npm run test:integration` — tests de integración
5. Verificar que sin env vars de R2, el upload funciona igual (fallback)
6. Con env vars de R2, el upload va al bucket
