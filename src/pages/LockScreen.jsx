import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

export default function LockScreen() {
  const [time, setTime] = useState(new Date())
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // Check if already unlocked and not manually navigated to lockscreen
    if (localStorage.getItem('launcherUnlocked') === 'true' && location.pathname === '/') {
      navigate('/home', { replace: true })
    }
    
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [navigate, location])

  const formatTime = (date) => {
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  const formatDate = (date) => {
    return date.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  }

  const handleLaunch = () => {
    localStorage.setItem('launcherUnlocked', 'true')
    navigate('/home')
  }

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <video 
        autoPlay 
        loop 
        muted 
        className="absolute inset-0 w-full h-full object-cover blur-sm"
      >
        <source src="/kakashi-hatake-naruto.3840x2160.mp4" type="video/mp4" />
      </video>
      
      <div className="absolute inset-0 bg-black/30" />
      
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-white">
        <div className="text-center mb-8">
          <div className="text-9xl font-bold tracking-wider mb-4">
            {formatTime(time)}
          </div>
          <div className="text-2xl text-gray-300 mb-12">
            {formatDate(time)}
          </div>
          
          <button
            onClick={handleLaunch}
            className="mt-8 px-12 py-4 bg-cyan-600 hover:bg-cyan-500 rounded-full text-xl font-bold transition-all duration-300 transform hover:scale-110 shadow-2xl shadow-cyan-500/50"
          >
            Khởi chạy Launcher
          </button>
        </div>
      </div>
      
      <div className="absolute bottom-8 right-8 text-white/70 text-sm text-right">
        <div>crackvìnghèo Launcher</div>
        <div>Version 4.0.0.0</div>
      </div>
    </div>
  )
}
