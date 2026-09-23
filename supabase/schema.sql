-- =============================================================
-- ESQUEMA DE BASE DE DATOS — TIENDA DE ROPA
-- Copia y pega en: Supabase -> SQL Editor -> New Query -> Run
-- =============================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================
-- TABLA: store_settings
-- Configuracion general de la tienda (1 sola fila)
-- =============================================================
CREATE TABLE IF NOT EXISTS store_settings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_name      TEXT NOT NULL DEFAULT 'Mi Boutique',
  whatsapp_number TEXT NOT NULL DEFAULT '573001234567',  -- Con codigo de pais, sin + ni espacios
  currency_symbol TEXT NOT NULL DEFAULT '$',
  currency_code   TEXT NOT NULL DEFAULT 'COP',           -- ISO 4217: COP, USD, MXN, etc.
  welcome_message TEXT DEFAULT '¡Hola! Te contacto desde la tienda online.',
  logo_url        TEXT,
  primary_color   TEXT DEFAULT '#8B5CF6',                -- Color principal de la marca (hex)
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar configuracion inicial por defecto
INSERT INTO store_settings (store_name, whatsapp_number, currency_symbol, currency_code)
VALUES ('Mi Boutique', '573001234567', '$', 'COP')
ON CONFLICT DO NOTHING;

-- =============================================================
-- TABLA: categories
-- Categorias de ropa (Vestidos, Pantalones, Tops, Accesorios...)
-- =============================================================
CREATE TABLE IF NOT EXISTS categories (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL UNIQUE,
  slug       TEXT NOT NULL UNIQUE,  -- URL-friendly: "vestidos", "tops", etc.
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categorias iniciales tipicas para una boutique
INSERT INTO categories (name, slug, sort_order) VALUES
  ('Vestidos',      'vestidos',     1),
  ('Tops',          'tops',         2),
  ('Pantalones',    'pantalones',   3),
  ('Faldas',        'faldas',       4),
  ('Conjuntos',     'conjuntos',    5),
  ('Accesorios',    'accesorios',   6),
  ('Zapatos',       'zapatos',      7),
  ('Ropa Interior', 'ropa-interior',8)
ON CONFLICT DO NOTHING;

-- =============================================================
-- TABLA: products
-- Productos del catalogo
-- =============================================================
CREATE TABLE IF NOT EXISTS products (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Informacion basica
  name         TEXT NOT NULL,
  category_id  UUID REFERENCES categories(id) ON DELETE SET NULL,
  price        NUMERIC(10, 2) NOT NULL CHECK (price >= 0),

  -- Tallas disponibles (array de texto: ["S", "M", "L", "XL", "Unica"])
  sizes        TEXT[] NOT NULL DEFAULT '{}',

  -- Imagen principal (URL de Supabase Storage — ya comprimida a WebP en cliente)
  image_url    TEXT NOT NULL,

  -- Imagenes adicionales (hasta 4 mas, mismo formato)
  extra_images TEXT[] DEFAULT '{}',

  -- Control de stock simplificado (semaforo):
  -- "available"  -> Verde  -> Disponible
  -- "low_stock"  -> Amarillo -> Ultimas unidades
  -- "sold_out"   -> Rojo   -> Agotado
  stock_status TEXT NOT NULL DEFAULT 'available'
    CHECK (stock_status IN ('available', 'low_stock', 'sold_out')),

  -- Visibilidad en el catalogo publico
  is_visible   BOOLEAN NOT NULL DEFAULT TRUE,

  -- Orden de aparicion en el catalogo (los mas nuevos primero por defecto)
  sort_order   INTEGER DEFAULT 0,

  -- Metadatos
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Indice para filtrado rapido por categoria y estado de stock
CREATE INDEX IF NOT EXISTS idx_products_category   ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_stock      ON products(stock_status);
CREATE INDEX IF NOT EXISTS idx_products_visible    ON products(is_visible);
CREATE INDEX IF NOT EXISTS idx_products_created    ON products(created_at DESC);

-- =============================================================
-- FUNCION: Actualizar updated_at automaticamente
-- =============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_settings_updated_at
  BEFORE UPDATE ON store_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================
-- ROW LEVEL SECURITY (RLS) — SEGURIDAD CRITICA
-- =============================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE products       ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories     ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

-- --- POLITICAS PUBLICAS (Lectura sin autenticacion) ---
-- El catalogo es publico: cualquier visitante puede ver productos y categorias

CREATE POLICY "Catalogo publico — lectura libre"
  ON products FOR SELECT
  USING (is_visible = TRUE AND stock_status != 'sold_out');

CREATE POLICY "Categorias publicas — lectura libre"
  ON categories FOR SELECT
  USING (TRUE);

CREATE POLICY "Configuracion publica — lectura libre"
  ON store_settings FOR SELECT
  USING (TRUE);

-- --- POLITICAS ADMIN (Escritura solo con autenticacion) ---
-- Solo el administrador autenticado puede crear, editar y eliminar

CREATE POLICY "Admin — insertar productos"
  ON products FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin — actualizar productos"
  ON products FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admin — eliminar productos"
  ON products FOR DELETE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admin — gestionar categorias"
  ON categories FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admin — actualizar configuracion"
  ON store_settings FOR UPDATE
  USING (auth.role() = 'authenticated');

-- =============================================================
-- STORAGE — BUCKET PARA FOTOS (Ejecutar desde Supabase Dashboard)
-- =============================================================
-- NOTA: Crear el bucket manualmente en Supabase Dashboard:
-- Storage -> New Bucket -> Nombre: "product-images" -> Public: SI
--
-- O ejecutar esto si tienes permisos de storage:
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('product-images', 'product-images', TRUE)
-- ON CONFLICT DO NOTHING;

-- =============================================================
-- DATOS DE PRUEBA (opcional — comentar en produccion)
-- =============================================================
/*
INSERT INTO products (name, category_id, price, sizes, image_url, stock_status)
SELECT
  'Vestido Floral Primavera',
  (SELECT id FROM categories WHERE slug = 'vestidos'),
  89900,
  ARRAY['S', 'M', 'L'],
  'https://via.placeholder.com/1080x1350/8B5CF6/FFFFFF?text=Demo',
  'available';
*/
