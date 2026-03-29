import Card from "../common/Card";
import { Wallet, ArrowLeftRight, User, Heart } from "lucide-react";

const actions = [
  { title: "Funds", icon: Wallet },
  { title: "Transactions", icon: ArrowLeftRight },
  { title: "Account details", icon: User },
  { title: "Invite", icon: Heart },
];

export default function QuickActions() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {actions.map((action) => {
        const Icon = action.icon;

        return (
          <Card
            key={action.title}
            className="flex items-center gap-3 p-4 hover:shadow-md transition"
          >
            <div className="bg-blue-100 p-2 rounded-lg">
              <Icon size={18} className="text-blue-600" />
            </div>

            <span className="text-sm">{action.title}</span>
          </Card>
        );
      })}
    </div>
  );
}