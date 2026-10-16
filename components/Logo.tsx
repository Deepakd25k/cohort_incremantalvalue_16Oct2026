export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className={`logo ${light ? "logo-light" : ""}`} aria-label="incrementalvalue">
      <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden>
        <rect width="32" height="32" rx="7" fill={light ? "#fff" : "#3155F5"} />
        <path
          d="M7 22.5h5v-5h5v-5h5V8"
          fill="none"
          stroke={light ? "#3155F5" : "#fff"}
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M18.5 8H22v3.5" fill="none" stroke={light ? "#3155F5" : "#fff"} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="logo-text">
        incremental<b>value</b>
      </span>
    </span>
  );
}
