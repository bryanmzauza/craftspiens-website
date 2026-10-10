// Partículas de poeira que sobem pela luz do hero. As posições são fixas para
// o servidor e o navegador renderizarem o mesmo HTML.
const MOTES = [
  { left: 6, size: 3, duration: 26, delay: 0, drift: 40, opacity: 0.5, mobile: true },
  { left: 13, size: 2, duration: 32, delay: -9, drift: -30, opacity: 0.35, mobile: false },
  { left: 21, size: 4, duration: 29, delay: -17, drift: 55, opacity: 0.45, mobile: true },
  { left: 28, size: 2, duration: 36, delay: -4, drift: -45, opacity: 0.3, mobile: false },
  { left: 36, size: 3, duration: 31, delay: -22, drift: 35, opacity: 0.4, mobile: true },
  { left: 44, size: 2, duration: 27, delay: -13, drift: -25, opacity: 0.35, mobile: false },
  { left: 52, size: 3, duration: 34, delay: -6, drift: 50, opacity: 0.4, mobile: true },
  { left: 59, size: 2, duration: 30, delay: -26, drift: -40, opacity: 0.3, mobile: false },
  { left: 66, size: 4, duration: 28, delay: -15, drift: 30, opacity: 0.5, mobile: true },
  { left: 73, size: 2, duration: 35, delay: -2, drift: -55, opacity: 0.3, mobile: false },
  { left: 80, size: 3, duration: 33, delay: -19, drift: 45, opacity: 0.45, mobile: true },
  { left: 87, size: 2, duration: 29, delay: -11, drift: -35, opacity: 0.35, mobile: false },
  { left: 93, size: 3, duration: 37, delay: -24, drift: 25, opacity: 0.4, mobile: true },
  { left: 48, size: 5, duration: 40, delay: -30, drift: -20, opacity: 0.25, mobile: false },
];

export function HeroMotes() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {MOTES.map((mote, i) => (
        <span
          key={i}
          className={`hero-mote ${mote.mobile ? "" : "hidden md:block"}`}
          style={
            {
              left: `${mote.left}%`,
              width: mote.size,
              height: mote.size,
              "--mote-duration": `${mote.duration}s`,
              "--mote-delay": `${mote.delay}s`,
              "--mote-drift": `${mote.drift}px`,
              "--mote-opacity": mote.opacity,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
