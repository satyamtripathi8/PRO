import clsx from "clsx";

export type OrderTab = "stocks" | "mutual";

interface Props {
  activeTab: OrderTab;
  onChange: (tab: OrderTab) => void;
}

export default function OrderTabs({ activeTab, onChange }: Props) {
  const tabs: OrderTab[] = ["stocks", "mutual"];

  return (
    <div className="flex gap-6 border-b pb-2">
      {tabs.map((tab) => {
        const isActive = activeTab === tab;

        return (
          <button
            key={tab}
            onClick={() => onChange(tab)}
            className={clsx(
              "text-sm pb-1 capitalize transition-colors",
              isActive
                ? "border-b-2 border-blue-500 text-blue-500"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            {tab}
          </button>
        );
      })}
    </div>
  );
}