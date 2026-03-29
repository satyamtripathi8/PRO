import Card from "../common/Card";
import type { LucideIcon } from "lucide-react";

interface Props {
  title: string;
  icon: LucideIcon;
}

export default function ActionCard({ title, icon: Icon }: Props) {
  return (
    <Card className="flex items-center gap-3 p-4 cursor-pointer hover:shadow-md transition">
      
      <div className="bg-blue-500 text-white p-2 rounded-md">
        <Icon size={18} />
      </div>

      <p className="text-sm font-medium">{title}</p>
    </Card>
  );
}