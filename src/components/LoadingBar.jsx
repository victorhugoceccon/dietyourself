import './LoadingBar.css'

function LoadingBar({ message = 'Gerando sua dieta...' }) {
  return (
    <div className="loading-bar-container">
      <div className="loading-bar-content">
        <div className="loading-spinner">
          <svg className="spinner" viewBox="0 0 50 50">
            <circle
              className="path"
              cx="25"
              cy="25"
              r="20"
              fill="none"
              strokeWidth="4"
            />
          </svg>
        </div>
        <p className="loading-message">{message}</p>
        <div className="loading-bar">
          <div className="loading-bar-fill"></div>
        </div>
        <p className="loading-subtitle">Isso pode levar alguns instantes...</p>
      </div>
    </div>
  )
}

export default LoadingBar


