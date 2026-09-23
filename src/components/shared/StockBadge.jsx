// Badge de estado de stock con color de semaforo
const StockBadge = ({ status }) => {
  const config = {
    available: {
      label: 'Disponible',
      dot: 'bg-green-400',
      classes: 'stock-badge stock-available',
    },
    low_stock: {
      label: 'Últimas unidades',
      dot: 'bg-yellow-400',
      classes: 'stock-badge stock-low',
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
