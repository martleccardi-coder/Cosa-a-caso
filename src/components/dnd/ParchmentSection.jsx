export default function ParchmentSection({ title, children, className = '' }) {
  return (
    <div
      className={`parchment-box p-2 ${className}`}
      style={{ position: 'relative' }}
    >
      {title && (
        <div className="section-header mb-2">{title}</div>
      )}
      {children}
    </div>
  );
}