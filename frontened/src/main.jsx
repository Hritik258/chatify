import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from "react-redux"
import { store } from './redux/store.js'
import axios from "axios"

// ✅ Use VITE_SERVER_URL from environment, fallback to localhost for development
export const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:8000"

axios.defaults.withCredentials = true

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Provider store={store}>
      <App />
    </Provider>
  </BrowserRouter>
)
