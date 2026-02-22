import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Browse from './pages/Browse'
import Guide from './pages/Guide'
import Map from './pages/Map'
import Plan from './pages/Plan'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="browse" element={<Browse />} />
          <Route path="guide" element={<Guide />} />
          <Route path="map" element={<Map />} />
          <Route path="plan" element={<Plan />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
