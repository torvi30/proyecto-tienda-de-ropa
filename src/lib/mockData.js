// =============================================================
// DATOS MOCK — Modo Demo (VITE_DEMO_MODE=true)
// Simula la BD de Supabase para desarrollar sin configurarla
// =============================================================

export const mockSettings = {
  store_name: 'Boutique Luna',
  whatsapp_number: '573001234567',
  currency_symbol: '$',
  currency_code: 'COP',
  welcome_message: '¡Hola! Te escribo desde la tienda online.',
  primary_color: '#8B5CF6',
}

export const mockCategories = [
  { id: 'cat-1', name: 'Vestidos',   slug: 'vestidos',   sort_order: 1 },
  { id: 'cat-2', name: 'Tops',       slug: 'tops',       sort_order: 2 },
  { id: 'cat-3', name: 'Pantalones', slug: 'pantalones', sort_order: 3 },
  { id: 'cat-4', name: 'Conjuntos',  slug: 'conjuntos',  sort_order: 4 },
  { id: 'cat-5', name: 'Accesorios', slug: 'accesorios', sort_order: 5 },
]

export const mockProducts = [
  {
    id: 'prod-1',
    name: 'Vestido Floral Primavera',
    category_id: 'cat-1',
    price: 89900,
    sizes: ['S', 'M', 'L'],
    image_url: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=1080&h=1350&fit=crop&crop=center',
    extra_images: [],
    stock_status: 'available',
    is_visible: true,
  },
  {
    id: 'prod-2',
    name: 'Top Satinado Rosa',
    category_id: 'cat-2',
    price: 45000,
    sizes: ['S', 'M'],
    image_url: 'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=1080&h=1350&fit=crop&crop=center',
    extra_images: [],
    stock_status: 'low_stock',
    is_visible: true,
  },
  {
    id: 'prod-3',
    name: 'Conjunto Lino Beige',
    category_id: 'cat-4',
    price: 129000,
    sizes: ['S', 'M', 'L', 'XL'],
    image_url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1080&h=1350&fit=crop&crop=center',
    extra_images: [],
    stock_status: 'available',
    is_visible: true,
  },
  {
    id: 'prod-4',
    name: 'Pantalon Wide Leg Negro',
    category_id: 'cat-3',
    price: 75000,
    sizes: ['M', 'L'],
    image_url: 'https://images.unsplash.com/photo-1594938298603-c8148c4f8c5d?w=1080&h=1350&fit=crop&crop=center',
    extra_images: [],
    stock_status: 'available',
    is_visible: true,
  },
  {
    id: 'prod-5',
    name: 'Vestido Mini Morado',
    category_id: 'cat-1',
    price: 99000,
    sizes: ['S', 'M'],
    image_url: 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=1080&h=1350&fit=crop&crop=center',
    extra_images: [],
    stock_status: 'available',
    is_visible: true,
  },
  {
    id: 'prod-6',
    name: 'Blusa Transparente Lunares',
    category_id: 'cat-2',
    price: 52000,
    sizes: ['S', 'M', 'L'],
    image_url: 'https://images.unsplash.com/photo-1583846783214-7229a91b20ed?w=1080&h=1350&fit=crop&crop=center',
    extra_images: [],
    stock_status: 'available',
    is_visible: true,
  },
]
