export default function ParchmentSection({ title, children, className = '' }) {
  return (
    <div className={`parchment-box p-3 mb-3 ${className}`}>
      {title && (
        <div className="section-header mb-2">{title}</div>
      )}
      {children}
    </div>
  );
}