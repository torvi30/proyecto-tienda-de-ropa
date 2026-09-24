import { Flame } from 'lucide-react'

// Badge de estado de stock con color de semáforo y soporte de urgencia estilo Shein
const StockBadge = ({ status }) => {
  if (status === 'low_stock') {
    return (
      <span className='inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/40 text-amber-300 shadow-lg shadow-amber-500/20 backdrop-blur-md select-none'>
        <Flame size={12} className='text-amber-400 fill-current animate-pulse' />
        <span>¡Casi agotado!</span>
      </span>
    )
  }

  const config = {
    available: {
      label: 'Disponible',
      dot: 'bg-green-400',
      classes: 'stock-badge stock-available',
    },
    sold_out: {
      label: 'Agotado',
      dot: 'bg-red-400',
      classes: 'stock-badge stock-sold',
    },
  }

  const { label, dot, classes } = config[status] || config.available

  return (
    <span className={classes}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  )
}

export default StockBadge
