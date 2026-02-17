# Changelog - Frontend Restaurant

Todos los cambios notables del frontend serán documentados en este archivo.

## [2.0.0] - 2026-02-17

### ✨ Sistema de Roles y Permisos

- **Control de acceso granular en AdminScreen**
  - Formulario de agregar usuarios visible solo para Super Administradores
  - Botones de eliminar usuarios visible solo para Super Administradores
  - Mensaje informativo para administradores regulares sobre permisos limitados
  - Detección automática del rol del usuario desde localStorage

### 🎨 UI/UX Mejorado

- **Selector de roles actualizado**
  - Agregada opción "Super Administrador" en formularios
  - Formulario de agregar usuario con 5 roles disponibles
  - Formulario de editar usuario con 5 roles disponibles

### 🔒 Seguridad

- Validación de rol en el cliente antes de mostrar componentes sensibles
- Variable `isSuperAdmin` para control de permisos

### 📱 Responsive Design

- **iPad Pro 12.9" optimizado** (v1.1.0)
  - Breakpoint específico para orientación portrait (1024x1366px)
  - Breakpoint específico para orientación landscape (1366x1024px)
  - Grid de 4 columnas para estadísticas
  - Layout optimizado para formularios y tarjetas

- **Mobile UX mejorado** (v1.0.1)
  - CashierScreen: Panel de órdenes pendientes con altura basada en viewport (vh)
  - Tablets: 55vh, Mobile: 60vh, Small mobile: 55vh
  - Ahora se muestran 3-4 órdenes visibles simultáneamente en dispositivos móviles

---

## [1.0.0] - 2025-10-23

### ✨ Características Principales

- Sistema completo de gestión de restaurante
- 4 pantallas principales: Admin, Cajero, Mesero, Cocina
- Gestión de platillos con imágenes
- Sistema de órdenes en tiempo real
- Reportes y estadísticas

### 🎨 Diseño

- Interfaz responsive con breakpoints personalizados
- Tema de colores marrón/beige para ambiente gastronómico
- Iconos de React Icons
- Alertas con SweetAlert2

### 🛠️ Stack Tecnológico

- React 19.0.0
- Vite 6.3.1
- Axios para peticiones HTTP
- XLSX para exportación de reportes
- jsPDF para generación de PDFs
- html2canvas para capturas de pantalla

