import clsx from "clsx";
import { Layers, MessageCircle } from "lucide-react";

export type LearnTab = "assets" | "community";

interface Props {
  active: LearnTab;
  onChange: (tab: LearnTab) => void;
}

export default function LearnTabs({ active, onChange }: Props) {
  const tabs = [
    { label: "Assets", key: "assets", icon: Layers },
    { label: "Community", key: "community", icon: MessageCircle },
  ];

  return (
    <div className="flex items-center gap-6 border-b text-sm">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = active === tab.key;

        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key as LearnTab)}
            className={clsx(
              "flex items-center gap-2 pb-2",
              isActive
                ? "border-b-2 border-blue-500 text-blue-500"
                : "text-gray-500"
            )}
          >
            <Icon size={16} />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}