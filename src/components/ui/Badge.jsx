import './Badge.css'

function Badge({ children, variant = 'default', size = 'medium', className = '' }) {
  return (
    <span className={`badge badge-${variant} badge-${size} ${className}`}>
      {children}
    </span>
  )
}

export default Badge

