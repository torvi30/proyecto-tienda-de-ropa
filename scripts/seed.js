// =============================================================
// SCRIPT DE INICIALIZACION (SEED) DE FIRESTORE
// Uso: npm run seed
// Opcional con auth: npm run seed admin@tutienda.com miPassword123
// =============================================================

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

// Cargar variables de entorno locales (.env.local o .env)
const loadEnv = () => {
  const envPath = fs.existsSync(path.join(rootDir, '.env.local'))
    ? path.join(rootDir, '.env.local')
    : path.join(rootDir, '.env')

  if (!fs.existsSync(envPath)) {
    console.error('❌ No se encontró archivo .env ni .env.local')
    process.exit(1)
  }

  const content = fs.readFileSync(envPath, 'utf8')
  const env = {}
  content.split('\n').forEach((line) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim()
      const val = trimmed.slice(eqIdx + 1).trim()
      env[key] = val
    }
  })
  return env
}

const env = loadEnv()

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
}

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('❌ Faltan credenciales de Firebase en el archivo de entorno')
  process.exit(1)
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

const INITIAL_CATEGORIES = [
  { name: 'Vestidos',      slug: 'vestidos',     sort_order: 1 },
  { name: 'Tops',          slug: 'tops',         sort_order: 2 },
  { name: 'Pantalones',    slug: 'pantalones',   sort_order: 3 },
  { name: 'Faldas',        slug: 'faldas',       sort_order: 4 },
  { name: 'Conjuntos',     slug: 'conjuntos',    sort_order: 5 },
  { name: 'Accesorios',    slug: 'accesorios',   sort_order: 6 },
  { name: 'Zapatos',       slug: 'zapatos',      sort_order: 7 },
  { name: 'Ropa Interior', slug: 'ropa-interior',sort_order: 8 },
]

const INITIAL_PRODUCTS = [
  {
    name: 'Vestido Floral Primavera',
    category_slug: 'vestidos',
    price: 89900,
    sizes: ['S', 'M', 'L'],
    image_url: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=1080&h=1350&fit=crop&crop=center',
    stock_status: 'available',
    is_visible: true,
  },
  {
    name: 'Top Satinado Rosa',
    category_slug: 'tops',
    price: 45000,
    sizes: ['S', 'M'],
    image_url: 'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=1080&h=1350&fit=crop&crop=center',
    stock_status: 'low_stock',
    is_visible: true,
  },
  {
    name: 'Conjunto Lino Beige',
    category_slug: 'conjuntos',
    price: 129000,
    sizes: ['S', 'M', 'L', 'XL'],
    image_url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1080&h=1350&fit=crop&crop=center',
    stock_status: 'available',
    is_visible: true,
  },
  {
    name: 'Pantalon Wide Leg Negro',
    category_slug: 'pantalones',
    price: 75000,
    sizes: ['M', 'L'],
    image_url: 'https://images.unsplash.com/photo-1594938298603-c8148c4f8c5d?w=1080&h=1350&fit=crop&crop=center',
    stock_status: 'available',
    is_visible: true,
  },
  {
    name: 'Vestido Mini Morado',
    category_slug: 'vestidos',
    price: 99000,
    sizes: ['S', 'M'],
    image_url: 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=1080&h=1350&fit=crop&crop=center',
    stock_status: 'available',
    is_visible: true,
  },
  {
    name: 'Blusa Transparente Lunares',
    category_slug: 'tops',
    price: 52000,
    sizes: ['S', 'M', 'L'],
    image_url: 'https://images.unsplash.com/photo-1583846783214-7229a91b20ed?w=1080&h=1350&fit=crop&crop=center',
    stock_status: 'available',
    is_visible: true,
  },
]

async function seedFirestore() {
  console.log('🚀 Iniciando script de inicialización de Firestore...')
  console.log(`📡 Proyecto: ${firebaseConfig.projectId}`)

  // Si se pasaron credenciales como argumentos, iniciar sesión para cumplir reglas de seguridad
  const [,, authEmail, authPassword] = process.argv
  if (authEmail && authPassword) {
    try {
      console.log(`🔐 Autenticando como: ${authEmail}...`)
      await signInWithEmailAndPassword(auth, authEmail, authPassword)
      console.log('  ✅ Sesión iniciada con éxito.')
    } catch (err) {
      console.warn(`  ⚠️ No se pudo autenticar (${err.message}). Intentando escribir directamente...`)
    }
  }

  try {
    // 1. Configuración de la tienda
    console.log('⚙️ Guardando configuración de la tienda...')
    await setDoc(doc(db, 'store_settings', 'general'), {
      store_name: 'Boutique Luna',
      whatsapp_number: env.VITE_WHATSAPP_NUMBER || '573001234567',
      currency_symbol: '$',
      currency_code: 'COP',
      welcome_message: '¡Hola! Te contacto desde la tienda online.',
      primary_color: '#8B5CF6',
      updated_at: serverTimestamp(),
    })
    console.log('  ✅ Configuración guardada en store_settings/general')

    // 2. Categorías
    console.log('📁 Creando categorías...')
    const categoryIdMap = {}
    for (const cat of INITIAL_CATEGORIES) {
      const catRef = doc(db, 'categories', cat.slug)
      await setDoc(catRef, {
        name: cat.name,
        slug: cat.slug,
        sort_order: cat.sort_order,
        created_at: serverTimestamp(),
      })
      categoryIdMap[cat.slug] = cat.slug
      console.log(`  ✅ Categoría: ${cat.name}`)
    }

    // 3. Productos iniciales
    console.log('👗 Creando productos iniciales...')
    for (const prod of INITIAL_PRODUCTS) {
      await addDoc(collection(db, 'products'), {
        name: prod.name,
        category_id: categoryIdMap[prod.category_slug] || null,
        price: prod.price,
        sizes: prod.sizes,
        image_url: prod.image_url,
        stock_status: prod.stock_status,
        is_visible: prod.is_visible,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      })
      console.log(`  ✅ Producto: ${prod.name}`)
    }

    console.log('\n🎉 ¡Inicialización completada con éxito!')
    console.log('Tu Firestore ahora tiene categorías, productos y configuración creados.')
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Error durante el seed de Firestore:', error.message || error)
    if (String(error).includes('NOT_FOUND') || String(error).includes('5')) {
      console.log('\n💡 NOTA IMPORTANTE:')
      console.log('El error NOT_FOUND indica que la base de datos Firestore aún no ha sido creada en la consola.')
      console.log(`1. Ve a: https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore`)
      console.log('2. Haz clic en el botón "Crear base de datos" (Create database).')
      console.log('3. Selecciona la ubicación (ej. nam5) y modo producción o prueba.')
      console.log('4. Vuelve a ejecutar: npm run seed')
    }
    process.exit(1)
  }
}

seedFirestore()
