import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LanguageProvider } from './i18n/LanguageContext'
import { AuthProvider } from './contexts/AuthContext'
import { DataProvider } from './contexts/DataContext'
import { ToastProvider } from './contexts/ToastContext'
import { DownloadProvider } from './context/DownloadContext'
import App from './App'
import Store from './pages/Store'
import Library from './pages/Library'
import GameDetail from './pages/GameDetail'
import Settings from './pages/Settings'
import Downloads from './pages/Downloads'
import WineManager from './pages/WineManager'
import Platforms from './pages/Platforms'
import Accessibility from './pages/Accessibility'
import EpicSale from './pages/EpicSale'
import SteamSale from './pages/SteamSale'
import Tags from './pages/Tags'
import Register from './pages/Register'
import Login from './pages/Login'
import Profile from './pages/Profile'
import Wishlist from './pages/Wishlist'
import LockScreen from './pages/LockScreen'
import Bypass from './pages/Bypass'
import OnlineFix from './pages/OnlineFix'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ToastProvider>
      <LanguageProvider>
        <AuthProvider>
          <DataProvider>
            <DownloadProvider>
              <BrowserRouter>
              <Routes>
                <Route path="/" element={<App />}>
                  <Route index element={<LockScreen />} />
                  <Route path="home" element={<Store />} />
                  <Route path="bypass" element={<Bypass />} />
                  <Route path="onlinefix" element={<OnlineFix />} />
                  <Route path="library" element={<Library />} />
                  <Route path="downloads" element={<Downloads />} />
                  <Route path="wishlist" element={<Wishlist />} />
                  <Route path="wine" element={<WineManager />} />
                  <Route path="platforms" element={<Platforms />} />
                  <Route path="accessibility" element={<Accessibility />} />
                  <Route path="game/:id" element={<GameDetail />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="epic-sale" element={<EpicSale />} />
                  <Route path="steam-sale" element={<SteamSale />} />
                  <Route path="tags" element={<Tags />} />
                </Route>
                <Route path="/register" element={<Register />} />
                <Route path="/auth/signup" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/auth/login" element={<Login />} />
                <Route path="/profile" element={<Profile />} />
              </Routes>
              </BrowserRouter>
            </DownloadProvider>
          </DataProvider>
        </AuthProvider>
      </LanguageProvider>
    </ToastProvider>
  </React.StrictMode>
)