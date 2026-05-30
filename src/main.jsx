import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Remove StrictMode — MindARThree.start() is not idempotent and would
// break under React 18 StrictMode's double-invoke behavior in development.
createRoot(document.getElementById('root')).render(<App />)
