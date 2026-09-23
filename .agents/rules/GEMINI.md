# REGLAS DEL PROYECTO — TIENDA DE ROPA

## Contexto del Proyecto

Plataforma de e-commerce para una boutique de ropa local.
Objetivo principal: CERO friccion operativa para el administrador + maxima conversion movil para el cliente.

## Stack Tecnologico (NO CAMBIAR SIN APROBACION EXPLICITA)

- **Frontend:** React 18 + Vite 5 (SPA)
- **Estilos:** Tailwind CSS v3 UNICAMENTE. No usar styled-components, emotion ni CSS Modules.
- **Iconos:** lucide-react UNICAMENTE. No instalar otras librerias de iconos.
- **Routing:** react-router-dom v6
- **Base de Datos:** Supabase (PostgreSQL + Auth + Storage + RLS)
- **Estado global:** Context API de React. NO usar Redux, Zustand ni Jotai.
- **Notificaciones:** react-hot-toast
- **Hosting:** Cloudflare Pages (archivos estaticos). NO usar Vercel.

## Reglas de Codigo

### General
- Usar JavaScript (.jsx), NO TypeScript.
- Siempre usar comillas simples para strings en JS.
- Imports de React al tope, luego librerias externas, luego imports locales (ordenados por carpeta).
- No usar `any` ni suprimir warnings sin comentar el motivo.

### Componentes
- Un componente por archivo.
- Nombres de componentes en PascalCase. Archivos en PascalCase.jsx.
- Props siempre con destructuring en la firma del componente.
- Usar arrow functions para componentes: `const MiComponente = ({ prop }) => { ... }`.

### Estilos con Tailwind
- Mobile-first SIEMPRE: las clases base aplican para movil, luego `sm:`, `md:`, `lg:`.
- Paleta de colores del proyecto (NO cambiar):
  - Primario: `violet-600` (#7C3AED) y `violet-500` (#8B5CF6)
  - Acento: `pink-400` (#F472B6)
  - Fondo oscuro: `gray-950` (#030712) y `gray-900` (#111827)
  - Texto: `gray-100` (#F3F4F6) sobre fondos oscuros
  - Estados de stock: `green-400` (disponible), `yellow-400` (ultimas unidades), `red-400` (agotado)
- Modo oscuro por defecto. La tienda usa dark mode como diseno base.

### Gestion de Imagenes (CRITICO)
- TODA imagen de producto se comprime en el CLIENTE antes de subir a Supabase Storage.
- Usar exclusivamente la utilidad `src/lib/imageCompressor.js` para esto.
- Formato de salida siempre: WebP, maximo 150KB, ratio 4:5 (1080x1350 px).
- NO subir imagenes originales del movil directamente.

### Supabase
- El cliente de Supabase se instancia SOLO en `src/lib/supabaseClient.js`. No crear instancias en otros archivos.
- Toda logica de acceso a datos va en hooks custom en `src/hooks/`.
- Nunca exponer claves de Supabase en codigo — siempre usar variables de entorno VITE_*.

### Modo Demo
- Si `import.meta.env.VITE_DEMO_MODE === 'true'`, usar datos mock de `src/lib/mockData.js`.
- El modo demo permite desarrollar y mostrar la app sin configurar Supabase.

## Arquitectura de Carpetas

```
src/
├── components/
│   ├── admin/         # Componentes exclusivos del panel admin (requieren auth)
│   ├── catalog/       # Componentes del catalogo publico
│   └── shared/        # Botones, modales, spinners — reutilizables en toda la app
├── hooks/
│   ├── useProducts.js       # CRUD de productos con Supabase
│   ├── useCategories.js     # Lectura de categorias
│   ├── useCart.js           # Estado del carrito (localStorage)
│   ├── useStoreSettings.js  # Configuracion de la tienda
│   └── useImageCompressor.js # Hook que envuelve imageCompressor.js
├── lib/
│   ├── supabaseClient.js    # UNICA instancia del cliente Supabase
│   ├── imageCompressor.js   # Logica de compresion WebP client-side
│   ├── mockData.js          # Datos de prueba para modo demo
│   └── whatsapp.js          # Generador de links de WhatsApp
├── pages/
│   ├── CatalogPage.jsx      # Pagina publica del catalogo
│   ├── ProductDetailPage.jsx # Detalle de producto
│   ├── AdminPage.jsx        # Panel de administracion (requiere auth)
│   └── LoginPage.jsx        # Login del administrador
├── store/
│   ├── CartContext.jsx      # Context del carrito de compras
│   └── StoreContext.jsx     # Context de configuracion de tienda
└── main.jsx
```

## Reglas de Negocio

### Catalogo Publico
- Solo mostrar productos con `is_visible = true` Y `stock_status != 'sold_out'`.
- Los agotados se ocultan del catalogo (no se muestran ni con filtro).
- Los filtros de talla y categoria son instantaneos (sin llamada a BD, filtrar en memoria).
- El carrito persiste en localStorage entre sesiones.

### Checkout por WhatsApp
- Al procesar compra, generar URL: `https://wa.me/{numero}?text={mensaje_codificado}`
- El mensaje incluye: nombre de cada producto, talla elegida, precio unitario y TOTAL.
- El numero de WhatsApp se lee de `store_settings.whatsapp_number`.

### Panel de Administracion
- Solo accesible con usuario autenticado (Supabase Auth).
- El admin puede: subir productos en lote, editar, cambiar stock y eliminar.
- La compresion de imagen ocurre ANTES de mostrar la preview al admin.

### Subida de Imagenes por Lotes
- Maximo 20 fotos por lote.
- Para cada foto del lote: un formulario inline con Nombre, Precio y Tallas.
- Al guardar el lote, subir las imagenes ya comprimidas a Supabase Storage y crear los productos en BD.

## Diseno Visual

- Estetica: Boutique premium de lujo, dark mode, glassmorfismo en tarjetas.
- Tipografia: Google Fonts — "Inter" para texto general, "Playfair Display" para titulos de marca.
- Las tarjetas de producto tienen sombra y efecto hover sutil de elevacion.
- El carrito flotante tiene animacion de entrada desde la derecha.
- Los chips de talla tienen estado activo/inactivo con transicion suave.
- Usar animaciones CSS sutiles (no librerias de animacion externas).
