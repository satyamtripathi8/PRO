export function Button({ children, variant = "primary",onclick }: any) {
  const base = "w-full py-2 rounded-sm font-medium";

  const styles =
    variant === "primary"
      ? "bg-blue-600 text-white hover:bg-blue-700"
      : "border";

  return <button className={`${base} ${styles}`} onClick={onclick} >{children}  </button>;
}
