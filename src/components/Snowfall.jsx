export default function Snowfall() {
  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      {[...Array(50)].map((_, i) => (
        <div
          key={i}
          className="absolute text-white"
          style={{
            left: `${Math.random() * 100}%`,
            top: `-${Math.random() * 20}%`,
            animation: `fall ${8 + Math.random() * 12}s linear infinite`,
            animationDelay: `${Math.random() * 8}s`,
            fontSize: `${10 + Math.random() * 15}px`,
            opacity: 0.7
          }}
        >
          ❄
        </div>
      ))}
      <style>{`
        @keyframes fall {
          to {
            transform: translateY(100vh) rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
