import { useState, useRef, useEffect } from 'react'
import { API_URL } from '../config/api'
import './ChatWidget.css'

// Função para sanitizar HTML permitindo apenas tags de formatação seguras
const sanitizeHTML = (html) => {
  if (!html || typeof html !== 'string') return ''
  
  // Lista de tags permitidas (apenas formatação de texto)
  const allowedTags = ['b', 'strong', 'i', 'em', 'u', 's', 'strike', 'br', 'p', 'span']
  
  // Se estiver no browser, usar DOMParser para parsing seguro
  if (typeof window !== 'undefined' && window.DOMParser) {
    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(html, 'text/html')
      
      // Remover scripts e elementos perigosos
      const scripts = doc.querySelectorAll('script, iframe, object, embed, form, input, button, link, style')
      scripts.forEach(el => el.remove())
      
      // Função recursiva para limpar nós
      const cleanNode = (node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          return node.textContent
        }
        
        if (node.nodeType === Node.ELEMENT_NODE) {
          const tagName = node.tagName.toLowerCase()
          
          // Se a tag não está permitida, retornar apenas o conteúdo interno
          if (!allowedTags.includes(tagName)) {
            let content = ''
            node.childNodes.forEach(child => {
              content += cleanNode(child)
            })
            return content
          }
          
          // Se a tag está permitida, manter ela
          let content = ''
          node.childNodes.forEach(child => {
            content += cleanNode(child)
          })
          
          // Para tags auto-fechadas
          if (tagName === 'br') {
            return '<br>'
          }
          
          return `<${tagName}>${content}</${tagName}>`
        }
        
        return ''
      }
      
      let cleanedHTML = ''
      doc.body.childNodes.forEach(node => {
        cleanedHTML += cleanNode(node)
      })
      
      return cleanedHTML || html // Fallback para o HTML original se algo der errado
    } catch (e) {
      console.warn('Erro ao sanitizar HTML:', e)
      // Fallback: remover apenas scripts e permitir tags básicas
    }
  }
  
  // Fallback: remover scripts e elementos perigosos, permitir apenas tags básicas
  let cleaned = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
  
  // Permitir apenas tags permitidas (versão simplificada)
  cleaned = cleaned.replace(/<(\/?)([a-z]+)([^>]*)>/gi, (match, closing, tagName) => {
    const tag = tagName.toLowerCase()
    if (allowedTags.includes(tag)) {
      if (tag === 'br' && !closing) {
        return '<br>'
      }
      return closing ? `</${tag}>` : `<${tag}>`
    }
    return ''
  })
  
  return cleaned
}

function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: 'Olá! 👋 Como posso te ajudar hoje?',
      sender: 'bot',
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    
    if (!inputMessage.trim() || loading) return

    const userMessage = {
      id: Date.now(),
      text: inputMessage.trim(),
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      
      const response = await fetch(`${API_URL}/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: userMessage.text
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao enviar mensagem')
      }

      const botMessage = {
        id: Date.now() + 1,
        text: data.response || 'Desculpe, não consegui processar sua mensagem.',
        sender: 'bot',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, botMessage])

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      const errorMessage = {
        id: Date.now() + 1,
        text: 'Desculpe, ocorreu um erro. Tente novamente.',
        sender: 'bot',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Botão flutuante do chat */}
      <button
        className="chat-widget-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Abrir chat"
      >
        {isOpen ? (
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 9H16M8 13H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        )}
        {!isOpen && messages.length > 1 && (
          <span className="chat-notification-badge"></span>
        )}
      </button>

      {/* Widget do chat */}
      {isOpen && (
        <div className="chat-widget-container">
          <div className="chat-widget-header">
            <div className="chat-widget-header-info">
              <div className="chat-bot-avatar">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9H21ZM19 21H5V3H13V9H19V21Z" fill="currentColor"/>
                </svg>
              </div>
              <div>
                <h3>Assistente Virtual</h3>
                <p>Estou aqui para ajudar</p>
              </div>
            </div>
            <button
              className="chat-widget-close"
              onClick={() => setIsOpen(false)}
              aria-label="Fechar chat"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          <div className="chat-widget-messages">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`chat-message ${message.sender === 'user' ? 'user-message' : 'bot-message'}`}
              >
                <div className="message-content">
                  <p dangerouslySetInnerHTML={{ __html: sanitizeHTML(message.text) }}></p>
                  <span className="message-time">
                    {message.timestamp.toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="chat-message bot-message">
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          <form className="chat-widget-input" onSubmit={handleSendMessage}>
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Digite sua mensagem..."
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || loading}
              className="chat-send-button"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  )
}

export default ChatWidget


