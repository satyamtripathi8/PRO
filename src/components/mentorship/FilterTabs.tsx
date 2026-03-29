import clsx from "clsx";

export type FilterKey = "all" | "option" | "stock" | "commodities";

interface Props {
  active: FilterKey;
  onChange: (key: FilterKey) => void;
}

const filters: { label: string; key: FilterKey }[] = [
  { label: "All", key: "all" },
  { label: "Option Trader", key: "option" },
  { label: "Stock Trader", key: "stock" },
  { label: "Commodities Trader", key: "commodities" },
];

export default function FilterTabs({ active, onChange }: Props) {
  return (
    <div className="flex gap-3 flex-wrap">
      {filters.map((f) => (
        <button
          key={f.key}
          onClick={() => onChange(f.key)}
          className={clsx(
            "px-4 py-1.5 text-sm rounded-full border transition",
            active === f.key
              ? "bg-blue-500 text-white border-blue-500"
              : "text-gray-500 border-gray-300 hover:bg-gray-100"
          )}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}