import { useState, useEffect, useMemo } from 'react'
import {
  TrendingUp, DollarSign, Package, Flame, Star,
  AlertTriangle, Layers, Sparkles, ArrowUpRight,
  CheckCircle2, Eye, EyeOff, Loader2, ArrowRight, MessageCircle
} from 'lucide-react'
import { db } from '../../lib/firebaseClient'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { useStore } from '../../store/StoreContext'
import useCategories from '../../hooks/useCategories'

const AdminMetrics = ({ onNavigateTab }) => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const { settings } = useStore()
  const { categories } = useCategories()

  const sym = settings?.currency_symbol || '$'
  const storeName = settings?.store_name || 'Boutique'

  // Real-time listener for products collection in Firestore
  useEffect(() => {
    if (!db) {
      setLoading(false)
      return
    }

    const q = query(collection(db, 'products'), orderBy('created_at', 'desc'))
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = []
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() })
        })
        setProducts(list)
        setLoading(false)
      },
      (err) => {
        console.error('Error loading Firestore metrics:', err)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  // Business Intelligence computations
  const stats = useMemo(() => {
    const total = products.length

    let totalInventoryValue = 0
    let totalDiscountSavings = 0
    let availableCount = 0
    let lowStockCount = 0
    let soldOutCount = 0
    let visibleCount = 0
    let promoCount = 0
    let featuredCount = 0
    let minPrice = total > 0 ? Infinity : 0
    let maxPrice = 0
    let minPriceProduct = null
    let maxPriceProduct = null

    // Category distribution map
    const categoryCountMap = {}

    products.forEach((p) => {
      const price = Number(p.price) || 0
      const origPrice = Number(p.original_price) || 0

      // Active inventory commercial value (excluding sold-out products)
      if (p.stock_status !== 'sold_out') {
        totalInventoryValue += price
      }

      // Stock status counters
      if (p.stock_status === 'available') availableCount++
      else if (p.stock_status === 'low_stock') lowStockCount++
      else if (p.stock_status === 'sold_out') soldOutCount++

      // Visibility counter
      if (p.is_visible !== false) visibleCount++

      // Promotional discount counters
      if (p.is_on_sale && origPrice > price) {
        promoCount++
        totalDiscountSavings += origPrice - price
      }

      // Featured garments counter
      if (p.is_featured) featuredCount++

      // Price extremes (minimum / maximum)
      if (price < minPrice && price > 0) {
        minPrice = price
        minPriceProduct = p
      }
      if (price > maxPrice) {
        maxPrice = price
        maxPriceProduct = p
      }

      // Count items per category
      const catId = p.category_id || 'sin_categoria'
      categoryCountMap[catId] = (categoryCountMap[catId] || 0) + 1
    })

    const avgPrice = total > 0 ? Math.round(totalInventoryValue / (availableCount + lowStockCount || 1)) : 0

    return {
      total,
      totalInventoryValue,
      totalDiscountSavings,
      availableCount,
      lowStockCount,
      soldOutCount,
      visibleCount,
      promoCount,
      featuredCount,
      minPrice: minPrice === Infinity ? 0 : minPrice,
      maxPrice,
      minPriceProduct,
      maxPriceProduct,
      avgPrice,
      categoryCountMap,
    }
  }, [products])

  if (loading) {
    return (
      <div className='flex flex-col items-center justify-center p-16 space-y-3'>
        <Loader2 size={32} className='text-brand-400 animate-spin' />
        <p className='text-gray-400 text-xs font-medium'>Calculando indicadores en tiempo real...</p>
      </div>
    )
  }

  // Inventory stock health percentages
  const availablePct = stats.total > 0 ? Math.round((stats.availableCount / stats.total) * 100) : 0
  const lowStockPct = stats.total > 0 ? Math.round((stats.lowStockCount / stats.total) * 100) : 0
  const soldOutPct = stats.total > 0 ? Math.round((stats.soldOutCount / stats.total) * 100) : 0

  return (
    <div className='space-y-6 font-sans animate-fade-in'>
      {/* 1. Executive Dashboard Header */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-800/80'>
        <div>
          <div className='flex items-center gap-2 text-brand-400 text-xs font-semibold uppercase tracking-wider mb-1'>
            <TrendingUp size={14} />
            <span>Panel Ejecutivo · {storeName}</span>
          </div>
          <h2 className='text-gray-100 font-display text-2xl sm:text-3xl font-bold'>
            Métricas del Negocio
          </h2>
          <p className='text-gray-400 text-xs sm:text-sm mt-0.5'>
            Monitoreo en vivo de inventario, valor comercial y salud del catálogo.
          </p>
        </div>

        {/* Real-time connection badge indicator */}
        <div className='flex items-center gap-2 self-start sm:self-auto px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold'>
          <span className='w-2 h-2 rounded-full bg-emerald-400 animate-pulse' />
          <span>Sincronizado en tiempo real</span>
        </div>
      </div>

      {/* WhatsApp Reception Status Banner */}
      <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-gray-900/60 to-gray-900/40 border border-emerald-500/25'>
        <div className='flex items-center gap-3'>
          <div className='w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0'>
            <MessageCircle size={20} />
          </div>
          <div>
            <div className='flex items-center gap-2 flex-wrap'>
              <span className='text-xs font-bold text-gray-200'>WhatsApp Receptor de Pedidos:</span>
              <span className='text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-800/60'>
                +{settings?.whatsapp_number || 'No configurado'}
              </span>
              {settings?.whatsapp_number === '573001234567' && (
                <span className='px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold'>
                  Número Demo
                </span>
              )}
            </div>
            <p className='text-gray-400 text-xs mt-0.5'>
              {settings?.whatsapp_number === '573001234567'
                ? '⚠️ Tu tienda está usando el número demo. Configura tu número real para que te lleguen las ventas.'
                : 'A este número llegan los carritos y pedidos automáticos de tus clientes.'}
            </p>
          </div>
        </div>

        <button
          type='button'
          onClick={() => onNavigateTab('settings')}
          className='px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0'
        >
          <span>Cambiar WhatsApp</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* 2. Main KPI Metric Cards (Glow & Glassmorphism) */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
        {/* KPI 1: Active Inventory Capital */}
        <div className='relative overflow-hidden bg-gradient-to-br from-brand-950/40 via-gray-900/60 to-gray-900/40 border border-brand-500/30 rounded-3xl p-5 shadow-xl'>
          <div className='flex items-center justify-between mb-3'>
            <span className='text-gray-400 text-xs font-semibold uppercase tracking-wider'>
              Capital Activo
            </span>
            <div className='w-8 h-8 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400'>
              <DollarSign size={16} />
            </div>
          </div>
          <div className='text-gray-100 font-bold text-2xl sm:text-3xl tabular-nums tracking-tight font-sans'>
            {sym}{stats.totalInventoryValue.toLocaleString('es-CO')}
          </div>
          <p className='text-gray-500 text-xs mt-1.5 flex items-center gap-1'>
            <span>Promedio por prenda:</span>
            <span className='text-brand-300 font-semibold'>{sym}{stats.avgPrice.toLocaleString('es-CO')}</span>
          </p>
        </div>

        {/* KPI 2: Total Garments Count */}
        <div className='relative overflow-hidden bg-gradient-to-br from-gray-900/80 via-gray-900/50 to-gray-950 border border-gray-800 rounded-3xl p-5 shadow-xl'>
          <div className='flex items-center justify-between mb-3'>
            <span className='text-gray-400 text-xs font-semibold uppercase tracking-wider'>
              Total Catálogo
            </span>
            <div className='w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400'>
              <Package size={16} />
            </div>
          </div>
          <div className='text-gray-100 font-bold text-2xl sm:text-3xl tabular-nums tracking-tight font-sans'>
            {stats.total} <span className='text-sm font-normal text-gray-500'>prendas</span>
          </div>
          <p className='text-gray-500 text-xs mt-1.5 flex items-center gap-2'>
            <span className='text-emerald-400 font-semibold'>{stats.availableCount} disp.</span>
            <span>•</span>
            <span className='text-yellow-400 font-semibold'>{stats.lowStockCount} últimas</span>
            <span>•</span>
            <span className='text-red-400 font-semibold'>{stats.soldOutCount} agot.</span>
          </p>
        </div>

        {/* KPI 3: On-Sale Items */}
        <div className='relative overflow-hidden bg-gradient-to-br from-pink-950/30 via-gray-900/50 to-gray-950 border border-pink-500/30 rounded-3xl p-5 shadow-xl'>
          <div className='flex items-center justify-between mb-3'>
            <span className='text-gray-400 text-xs font-semibold uppercase tracking-wider'>
              Ofertas Activas
            </span>
            <div className='w-8 h-8 rounded-xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-pink-400'>
              <Flame size={16} />
            </div>
          </div>
          <div className='text-pink-400 font-bold text-2xl sm:text-3xl tabular-nums tracking-tight font-sans'>
            {stats.promoCount} <span className='text-sm font-normal text-gray-500'>en promo</span>
          </div>
          <p className='text-gray-500 text-xs mt-1.5'>
            Ahorro clientes: <span className='text-pink-300 font-semibold'>{sym}{stats.totalDiscountSavings.toLocaleString('es-CO')}</span>
          </p>
        </div>

        {/* KPI 4: Featured Items */}
        <div className='relative overflow-hidden bg-gradient-to-br from-amber-950/30 via-gray-900/50 to-gray-950 border border-amber-500/30 rounded-3xl p-5 shadow-xl'>
          <div className='flex items-center justify-between mb-3'>
            <span className='text-gray-400 text-xs font-semibold uppercase tracking-wider'>
              Top Portada
            </span>
            <div className='w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400'>
              <Star size={16} />
            </div>
          </div>
          <div className='text-amber-300 font-bold text-2xl sm:text-3xl tabular-nums tracking-tight font-sans'>
            {stats.featuredCount} <span className='text-sm font-normal text-gray-500'>destacadas</span>
          </div>
          <p className='text-gray-500 text-xs mt-1.5'>
            Prioridad máxima en la cima del catálogo
          </p>
        </div>
      </div>

      {/* 3. Graphical Analysis & Stock Health Distribution */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Left Panel: Inventory Health & Stock States */}
        <div className='bg-gray-900/60 border border-gray-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5'>
          <div className='flex items-center justify-between pb-3 border-b border-gray-800/80'>
            <div>
              <h3 className='text-gray-100 font-semibold text-base flex items-center gap-2'>
                <span>Salud del Inventario</span>
              </h3>
              <p className='text-gray-500 text-xs'>
                Disponibilidad actual del catálogo para ventas
              </p>
            </div>
            <span className='text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30'>
              {availablePct}% Operativo
            </span>
          </div>

          {/* Visual segmented progress bar */}
          <div className='space-y-2'>
            <div className='h-4 w-full bg-gray-950 rounded-full overflow-hidden flex border border-gray-800 p-0.5'>
              {availablePct > 0 && (
                <div
                  style={{ width: `${availablePct}%` }}
                  className='bg-emerald-400 rounded-l-full h-full transition-all duration-500'
                  title={`Disponible: ${stats.availableCount} (${availablePct}%)`}
                />
              )}
              {lowStockPct > 0 && (
                <div
                  style={{ width: `${lowStockPct}%` }}
                  className='bg-amber-400 h-full transition-all duration-500'
                  title={`Últimas unidades: ${stats.lowStockCount} (${lowStockPct}%)`}
                />
              )}
              {soldOutPct > 0 && (
                <div
                  style={{ width: `${soldOutPct}%` }}
                  className='bg-red-400 rounded-r-full h-full transition-all duration-500'
                  title={`Agotado: ${stats.soldOutCount} (${soldOutPct}%)`}
                />
              )}
            </div>

            {/* Color legend for stock health */}
            <div className='grid grid-cols-3 gap-2 pt-2 text-xs'>
              <div className='p-3 rounded-2xl bg-gray-950/70 border border-gray-800/80'>
                <div className='flex items-center gap-1.5 text-emerald-400 font-semibold'>
                  <span className='w-2 h-2 rounded-full bg-emerald-400' />
                  <span>Disponible</span>
                </div>
                <div className='text-gray-100 font-bold text-lg mt-1 tabular-nums'>
                  {stats.availableCount}
                </div>
                <span className='text-gray-500 text-[11px]'>{availablePct}% del stock</span>
              </div>

              <div className='p-3 rounded-2xl bg-gray-950/70 border border-gray-800/80'>
                <div className='flex items-center gap-1.5 text-amber-400 font-semibold'>
                  <span className='w-2 h-2 rounded-full bg-amber-400' />
                  <span>Últimas U.</span>
                </div>
                <div className='text-gray-100 font-bold text-lg mt-1 tabular-nums'>
                  {stats.lowStockCount}
                </div>
                <span className='text-gray-500 text-[11px]'>{lowStockPct}% del stock</span>
              </div>

              <div className='p-3 rounded-2xl bg-gray-950/70 border border-gray-800/80'>
                <div className='flex items-center gap-1.5 text-red-400 font-semibold'>
                  <span className='w-2 h-2 rounded-full bg-red-400' />
                  <span>Agotado</span>
                </div>
                <div className='text-gray-100 font-bold text-lg mt-1 tabular-nums'>
                  {stats.soldOutCount}
                </div>
                <span className='text-gray-500 text-[11px]'>{soldOutPct}% del stock</span>
              </div>
            </div>
          </div>

          {/* Smart inventory restock alert */}
          {stats.lowStockCount > 0 && (
            <div className='p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2.5'>
              <AlertTriangle size={16} className='text-amber-400 shrink-0 mt-0.5' />
              <div>
                <span className='font-bold'>Atención de inventario:</span> Hay{' '}
                <span className='underline font-bold'>{stats.lowStockCount} prendas</span> con pocas unidades que pronto pasarán a agotadas. Se recomienda reponer stock o lanzar nuevas fotos.
              </div>
            </div>
          )}
        </div>

        {/* Right Panel: Distribution by Categories */}
        <div className='bg-gray-900/60 border border-gray-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5'>
          <div className='flex items-center justify-between pb-3 border-b border-gray-800/80'>
            <div>
              <h3 className='text-gray-100 font-semibold text-base flex items-center gap-2'>
                <Layers size={16} className='text-brand-400' />
                <span>Prendas por Categoría</span>
              </h3>
              <p className='text-gray-500 text-xs'>
                Distribución de tu catálogo entre las diferentes líneas
              </p>
            </div>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('categories')}
                className='text-xs text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1'
              >
                <span>Gestionar</span>
                <ArrowRight size={13} />
              </button>
            )}
          </div>

          <div className='space-y-3.5'>
            {categories.length === 0 ? (
              <p className='text-gray-500 text-xs text-center py-6'>
                No hay categorías registradas aún
              </p>
            ) : (
              categories.map((cat) => {
                const count = stats.categoryCountMap[cat.id] || 0
                const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0
                return (
                  <div key={cat.id} className='space-y-1.5'>
                    <div className='flex items-center justify-between text-xs'>
                      <span className='text-gray-300 font-medium'>{cat.name}</span>
                      <span className='text-gray-500'>
                        <span className='text-gray-200 font-bold'>{count}</span> prendas ({pct}%)
                      </span>
                    </div>
                    <div className='h-2 w-full bg-gray-950 rounded-full overflow-hidden'>
                      <div
                        style={{ width: `${pct}%` }}
                        className='h-full bg-gradient-to-r from-brand-600 to-purple-500 rounded-full transition-all duration-500'
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* 4. Pricing Intelligence & Range Distribution */}
      <div className='bg-gradient-to-br from-gray-900/90 via-gray-900/50 to-gray-950 border border-gray-800 rounded-3xl p-5 sm:p-6 shadow-xl'>
        <div className='flex items-center justify-between pb-3 border-b border-gray-800/80 mb-4'>
          <div>
            <h3 className='text-gray-100 font-semibold text-base'>
              Rango de Precios del Catálogo
            </h3>
            <p className='text-gray-500 text-xs'>
              Dispersión de precios de la boutique
            </p>
          </div>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
          <div className='p-4 rounded-2xl bg-gray-950/70 border border-gray-800/80'>
            <span className='text-gray-500 text-xs uppercase tracking-wider font-semibold block mb-1'>
              Prenda Más Accesible
            </span>
            <div className='text-emerald-400 font-bold text-xl tabular-nums'>
              {sym}{stats.minPrice.toLocaleString('es-CO')}
            </div>
            {stats.minPriceProduct && (
              <p className='text-gray-400 text-xs truncate mt-0.5'>
                {stats.minPriceProduct.name}
              </p>
            )}
          </div>

          <div className='p-4 rounded-2xl bg-gray-950/70 border border-gray-800/80'>
            <span className='text-gray-500 text-xs uppercase tracking-wider font-semibold block mb-1'>
              Precio Promedio Boutique
            </span>
            <div className='text-brand-300 font-bold text-xl tabular-nums'>
              {sym}{stats.avgPrice.toLocaleString('es-CO')}
            </div>
            <p className='text-gray-400 text-xs mt-0.5'>
              Ticket base estimado por prenda
            </p>
          </div>

          <div className='p-4 rounded-2xl bg-gray-950/70 border border-gray-800/80'>
            <span className='text-gray-500 text-xs uppercase tracking-wider font-semibold block mb-1'>
              Prenda Más Exclusiva
            </span>
            <div className='text-pink-400 font-bold text-xl tabular-nums'>
              {sym}{stats.maxPrice.toLocaleString('es-CO')}
            </div>
            {stats.maxPriceProduct && (
              <p className='text-gray-400 text-xs truncate mt-0.5'>
                {stats.maxPriceProduct.name}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminMetrics
