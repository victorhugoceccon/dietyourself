import { useState } from 'react'
import './CommentInput.css'

function CommentInput({ checkInId, onComment }) {
  const [comment, setComment] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (comment.trim() && onComment) {
      onComment(comment.trim())
      setComment('')
      setIsExpanded(false)
    }
  }

  if (!isExpanded) {
    return (
      <button
        className="comment-input-toggle"
        onClick={() => setIsExpanded(true)}
      >
        💬 Comentar
      </button>
    )
  }

  return (
    <form className="comment-input-form" onSubmit={handleSubmit}>
      <input
        type="text"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Escreva um comentário..."
        maxLength={500}
        autoFocus
        className="comment-input-field"
      />
      <div className="comment-input-actions">
        <button
          type="button"
          className="comment-input-cancel"
          onClick={() => {
            setIsExpanded(false)
            setComment('')
          }}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="comment-input-submit"
          disabled={!comment.trim()}
        >
          Enviar
        </button>
      </div>
    </form>
  )
}

export default CommentInput
