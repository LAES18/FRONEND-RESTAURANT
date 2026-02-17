# 🔧 Solución al Error de Login (500 Internal Server Error)

**Fecha**: 24 de Octubre de 2025  
**Problema**: El frontend estaba intentando conectar a Railway en lugar del servidor local

---

## ✅ Problema Resuelto

El error ocurría porque el **frontend** tenía hardcodeada la URL de Railway en su archivo `.env`:

```env
# ❌ ANTIGUO (incorrecto para producción local)
VITE_API_URL=https://backend-restaurant-production-b56f.up.railway.app
```

### Solución Aplicada

1. **Actualizado `/var/www/FRONEND-RESTAURANT/.env`**:
   ```env
   # ✅ NUEVO (correcto para producción local)
   VITE_API_URL=http://192.168.0.12
   ```

2. **Rebuilt el frontend**:
   ```bash
   cd /var/www/FRONEND-RESTAURANT
   npm run build
   ```

3. **Reemplazado el build en Nginx**:
   ```bash
   sudo cp -r dist/* /var/www/html/restaurant/
   sudo chown -R www-data:www-data /var/www/html/restaurant
   ```

---

## 🔍 Verificación

### Backend funcionando correctamente:
```bash
# Test directo al backend
curl -X POST http://localhost:3001/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin","password":"admin"}'
# ✅ Respuesta: HTTP/1.1 200 OK
```

### Nginx proxy funcionando correctamente:
```bash
# Test via Nginx
curl -X POST http://192.168.0.12/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin","password":"admin"}'
# ✅ Respuesta: HTTP/1.1 200 OK
```

### Frontend actualizado:
```bash
# Verificar que el bundle contiene la URL correcta
grep -r "192.168.0.12" /var/www/html/restaurant/assets/*.js
# ✅ URL correcta encontrada en el bundle
```

---

## 🌐 ACCIÓN REQUERIDA (Usuario)

**Para ver los cambios, DEBES refrescar la página en tu navegador**:

### Opción 1: Hard Refresh (Recomendado)
- **Windows/Linux**: Presiona `CTRL` + `SHIFT` + `R`
- **Mac**: Presiona `CMD` + `SHIFT` + `R`

### Opción 2: Limpiar caché manualmente
1. Abre DevTools (F12)
2. Click derecho en el botón de recargar
3. Selecciona "Empty Cache and Hard Reload"

### Opción 3: Modo incógnito
- Abre una ventana de incógnito/privada
- Navega a `http://192.168.0.12/`

---

## 📊 Estado Actual del Sistema

| Componente | Estado | URL |
|------------|--------|-----|
| Backend (Node.js) | ✅ Funcionando | http://localhost:3001 |
| Nginx (Proxy) | ✅ Funcionando | http://192.168.0.12 |
| Frontend (Build) | ✅ Actualizado | /var/www/html/restaurant |
| API Login | ✅ Respondiendo 200 OK | http://192.168.0.12/api/login |

---

## 🐛 Por Qué Ocurrió el Error

### Error en consola del navegador:
```
POST http://192.168.0.12/api/login 500 (Internal Server Error)
```

### Causa raíz:
El navegador tenía **cacheado** el JavaScript antiguo del frontend que contenía:
```javascript
// Código viejo (cacheado)
const baseURL = "https://backend-restaurant-production-b56f.up.railway.app";
```

Por eso intentaba primero conectar al servidor local (fallaba con 500 porque el build viejo no manejaba bien el error), y luego intentaba conectar a Railway (fallaba con CORS).

### Solución:
Ahora el nuevo build contiene:
```javascript
// Código nuevo (actualizado)
const baseURL = "http://192.168.0.12";
```

---

## 📝 Para Futuros Deployments

### Cuando actualices el frontend:

1. **Actualiza `.env` con la URL correcta**:
   ```bash
   cd /var/www/FRONEND-RESTAURANT
   nano .env  # Edita VITE_API_URL
   ```

2. **Rebuild**:
   ```bash
   npm run build
   ```

3. **Copia a Nginx**:
   ```bash
   sudo cp -r dist/* /var/www/html/restaurant/
   sudo chown -R www-data:www-data /var/www/html/restaurant
   ```

4. **Notifica a usuarios para refrescar** (CTRL+SHIFT+R)

---

## 🔐 Credenciales por Defecto

| Usuario | Password | Rol |
|---------|----------|-----|
| admin | admin | Admin |

---

## ✅ Conclusión

El sistema está **completamente funcional**. Solo necesitas refrescar la página en tu navegador para que cargue el nuevo build del frontend con la URL correcta del servidor local.

**Comando de verificación completa**:
```bash
/var/www/BACKEND-RESTAURANT/deploy/verify-deployment.sh
```

---

**Última actualización**: 24/10/2025 00:59 CST
