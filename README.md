# Tienda de Ropa — Catalogo y Gestion de Inventario Web

Plataforma de comercio electronico de friccion cero, disenada para boutiques y tiendas de ropa locales.
Enfocada en la gestion rapida de inventario desde dispositivos moviles y un embudo de ventas directo a WhatsApp.

---

## Stack Tecnologico

| Capa | Tecnologia | Costo en Produccion |
|---|---|---|
| Frontend | React + Vite (Mobile-first, SPA) | $0 |
| Estilos | Tailwind CSS v3 | $0 |
| Base de Datos y Auth | Supabase (PostgreSQL + RLS) | $0 (500MB gratis) |
| Almacenamiento de Fotos | Supabase Storage (WebP optimizado) | $0 (1GB gratis = ~7.000 fotos) |
| Hosting | Cloudflare Pages | $0 permanente, sin limite de bandwidth |
| Checkout | WhatsApp Business API (enlace dinamico) | $0 |
| Dominio | .pages.dev gratis o dominio propio | $0 / ~$10 al año |

### Costo Total en Produccion: $0/mes

---

## Caracteristicas Principales

### Para el Administrador (Friccion Operativa Cero)
- Compresion Client-Side: Fotos del movil se convierten a WebP automaticamente en el navegador (ahorro 90% espacio).
- Formato Estandar de Moda: Redimension automatica al ratio 4:5 vertical (1080x1350 px).
- Carga por Lotes (Drag & Drop): Solo 3 campos por producto: Nombre, Precio y Tallas.
- Stock Semaforo: Verde Disponible / Amarillo Ultimas unidades / Rojo Agotado.
- Panel de Configuracion: El dueno actualiza WhatsApp, nombre de la boutique y moneda sin tocar codigo.

### Para el Cliente
- Rendimiento Mobile-First: Experiencia fluida en redes 3G/4G.
- Filtros en Tiempo Real: Por talla, categoria y precio sin recargar la pagina.
- Carrito Flotante: Exporta el pedido como mensaje estructurado a WhatsApp.

---

## Estructura del Proyecto

```
proyecto-tienda-de-ropa/
├── public/
├── src/
│   ├── components/
│   │   ├── admin/       # Panel de administracion
│   │   ├── catalog/     # Catalogo publico
│   │   └── shared/      # Componentes reutilizables
│   ├── hooks/           # useCart, useProducts, useImageCompressor
│   ├── lib/             # supabaseClient.js, imageCompressor.js
│   ├── pages/           # Catalog, Admin, Login
│   ├── store/           # Estado global (Context API)
│   └── main.jsx
├── supabase/
│   └── schema.sql       # Esquema SQL completo listo para Supabase
├── .env.example
├── .gitignore
└── README.md
```

---

## Configuracion Local

```bash
npm install
cp .env.example .env.local
# Editar .env.local con las claves de Supabase
npm run dev
# Abre http://localhost:5173
```

---

## Despliegue — Cloudflare Pages ($0 para siempre)

```bash
npm run build
# Subir la carpeta /dist a Cloudflare Pages
# Framework: Vite | Build: npm run build | Output: dist
```

---

## Seguridad

- NUNCA subir .env.local al repositorio (esta en .gitignore)
- Row Level Security (RLS) activo en Supabase
- El admin requiere autenticacion

---

## Fases de Desarrollo

- [x] Fase 1: Estructura base, reglas del proyecto y esquema SQL
- [ ] Fase 2: Componente de compresion de imagenes + subida por lotes
- [ ] Fase 3: Catalogo publico con filtros en tiempo real
- [ ] Fase 4: Carrito flotante + Checkout por WhatsApp
- [ ] Fase 5: Panel de administracion completo (CRUD + stock)
- [ ] Fase 6: Pagina de configuracion de la tienda
- [ ] Fase 7: Despliegue en Cloudflare Pages

---
Arquitectura disenada para escalar sin costos fijos.
