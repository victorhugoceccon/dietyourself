import './Card.css'

function Card({ children, className = '', variant = 'default', onClick, hoverable = false }) {
  const Component = onClick ? 'button' : 'div'
  const props = onClick ? { onClick, type: 'button' } : {}

  return (
    <Component
      className={`card card-${variant} ${hoverable ? 'card-hoverable' : ''} ${className}`}
      {...props}
    >
      {children}
    </Component>
  )
}

export default Card

