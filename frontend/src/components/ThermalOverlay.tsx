'use client';

/**
 * Viewfinder chrome shown over the map in Thermal Vision: corner brackets, a
 * scanline wash and an ironbow scale keyed to the actual temperature range on
 * screen. The scale is the part that earns its place — without it the colours
 * are decoration; with it the map is readable as a measurement.
 */
export function ThermalOverlay({
  minTemp,
  maxTemp,
  zoneCount,
}: {
  minTemp: number;
  maxTemp: number;
  zoneCount: number;
}) {
  const hasRange = Number.isFinite(minTemp) && Number.isFinite(maxTemp);
  const mid = (minTemp + maxTemp) / 2;

  return (
    <>
      <div className="thermal-scanlines" aria-hidden />

      {/* Corner brackets */}
      <div aria-hidden className="absolute inset-0 pointer-events-none z-[600]">
        <span className="thermal-bracket top-3 left-3 border-t-2 border-l-2 rounded-tl-sm" />
        <span className="thermal-bracket top-3 right-3 border-t-2 border-r-2 rounded-tr-sm" />
        <span className="thermal-bracket bottom-3 left-3 border-b-2 border-l-2 rounded-bl-sm" />
        <span className="thermal-bracket bottom-3 right-3 border-b-2 border-r-2 rounded-br-sm" />
      </div>

      {/* Sensor readout */}
      <div className="absolute bottom-4 left-4 z-[600] pointer-events-none">
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-elevated/85 border border-subtle">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          <span className="thermal-readout text-[10px] font-semibold tracking-[0.14em] text-accent">
            IR COMPOSITE
          </span>
          <span className="thermal-readout text-[10px] text-tertiary tracking-wider">
            {zoneCount} ZONES
          </span>
        </div>
      </div>

      {/* Ironbow scale, labelled with the range actually on screen */}
      {hasRange && (
        <div className="absolute right-4 top-20 z-[600] pointer-events-none flex items-stretch gap-2">
          <div className="flex flex-col justify-between items-end py-0.5">
            {[maxTemp, mid, minTemp].map((t, i) => (
              <span key={i} className="thermal-readout text-[10px] font-medium text-secondary leading-none">
                {t.toFixed(0)}°
              </span>
            ))}
          </div>
          <div
            className="w-2.5 h-32 rounded-full border border-subtle"
            style={{
              backgroundImage:
                'linear-gradient(to top, var(--ramp-0), var(--ramp-1) 32%, var(--ramp-2) 55%, var(--ramp-3) 78%, var(--ramp-4))',
            }}
          />
        </div>
      )}
    </>
  );
}
