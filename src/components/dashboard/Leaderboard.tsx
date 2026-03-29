import Card from "../common/Card";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";

type LeaderboardItem = {
  id: string | number;
  rank: string;      // "1st", "2nd"
  name: string;
  value: number;     // percentage
};

interface LeaderboardProps {
  data: LeaderboardItem[];
  title?: string;
  className?: string;
  clickable?: boolean;
}

export default function Leaderboard({
  data,
  title = "Leaderboard",
  className,
  clickable = true,
}: LeaderboardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (clickable) {
      navigate('/leaderboard');
    }
  };

  return (
    <Card 
      className={clsx(
        clickable && "cursor-pointer hover:shadow-md transition-shadow",
        className
      )}
      onClick={handleClick}
    >
      {/* Header */}
      <h2 className="font-semibold mb-4">{title}</h2>

      {/* List */}
      {data.map((item, index) => (
        <div
          key={item.id}
          className={`flex justify-between py-2 ${
            index !== data.length - 1 ? "border-b" : ""
          }`}
        >
          <span>{item.rank}</span>
          <span>{item.name}</span>
          <span>{item.value}%</span>
        </div>
      ))}
    </Card>
  );
}