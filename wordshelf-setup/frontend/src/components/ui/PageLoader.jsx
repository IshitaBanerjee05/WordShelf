export default function PageLoader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center"
         style={{ background: 'var(--bg)' }}>
      <div className="flex flex-col items-center gap-4">
        {/* Animated book icon */}
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-2xl bg-sage-400 opacity-20 animate-ping" />
          <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-sage-400 to-lavender-400
                          flex items-center justify-center text-2xl shadow-sage">
            📚
          </div>
        </div>
        {/* Dots */}
        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-sage-400 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
        <p className="text-xs font-body text-[var(--text-muted)]">
          Loading WordShelf…
        </p>
      </div>
    </div>
  )
}
