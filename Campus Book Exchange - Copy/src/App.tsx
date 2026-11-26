import { Routes, Route } from 'react-router-dom'
import { Shell } from './components/bookswap/shell'
import Home from './components/bookswap/home'
import CatalogPage from './pages/etalase'
import SellPage from './pages/jual-buku'
import AboutPage from './pages/tentang-kami'
import PesanPage from './pages/pesan'
import LoginPage from './pages/login'
import SignUpPage from './pages/signup'
import LupaPasswordPage from './pages/lupa-password'
import ProfilPage from './pages/profil'
import NotFound from './pages/not-found'

export default function App() {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/etalase" element={<CatalogPage />} />
        <Route path="/jual-buku" element={<SellPage />} />
        <Route path="/tentang-kami" element={<AboutPage />} />
        <Route path="/pesan" element={<PesanPage />} />
        <Route path="/pesan/:id" element={<PesanPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/lupa-password" element={<LupaPasswordPage />} />
        <Route path="/profil" element={<ProfilPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Shell>
  )
}
