export function Button({ children, variant = "primary", onclick, disabled, type, ...props }: any) {
  const base = "w-full py-2 rounded-sm font-medium transition-colors";

  const styles =
    variant === "primary"
      ? "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600"
      : "border disabled:opacity-50";

  return (
    <button 
      className={`${base} ${styles}`} 
      onClick={onclick} 
      disabled={disabled}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}
