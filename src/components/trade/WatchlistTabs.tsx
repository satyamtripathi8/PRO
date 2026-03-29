import clsx from "clsx";

export type TabKey = "explore" | "myIndices" | "secondList";

interface Props {
  active: TabKey;
  onChange: (tab: TabKey) => void;
}

const tabs: { label: string; key: TabKey }[] = [
  { label: "Explore", key: "explore" },
  { label: "MyIndices", key: "myIndices" },
  { label: "SecondList", key: "secondList" },
];

export default function WatchlistTabs({ active, onChange }: Props) {
  return (
    <div className="flex border-b text-sm">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={clsx(
            "px-4 py-2",
            active === t.key
              ? "border-b-2 border-blue-500 text-blue-500"
              : "text-gray-500"
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}