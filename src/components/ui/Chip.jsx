import { useState } from 'react'
import './Chip.css'

function Chip({ 
  children, 
  onClick, 
  variant = 'default', 
  size = 'medium',
  selected = false,
  className = '' 
}) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <button
      className={`chip chip-${variant} chip-${size} ${selected ? 'chip-selected' : ''} ${className}`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      type="button"
    >
      <span className="chip-content">{children}</span>
    </button>
  )
}

export default Chip

