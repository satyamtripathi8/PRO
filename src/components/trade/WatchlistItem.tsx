interface Props {
  name: string;
  symbol: string;
  price: number;
  change: number;
  percentage: number;
  isActive?: boolean;
  onClick?: () => void;
}

export default function WatchlistItem({
  name,
  price,
  change,
  percentage,
  isActive,
  onClick,
}: Props) {
  return (
    <div
      onClick={onClick}
      className={`flex justify-between p-3 rounded cursor-pointer transition ${
        isActive ? "bg-blue-100" : "hover:bg-gray-100"
      }`}
    >
      <p>{name}</p>

      <div className="text-right">
        <p>₹ {price}</p>

        <p
          className={`text-sm ${
            change >= 0 ? "text-green-500" : "text-red-500"
          }`}
        >
          {change >= 0 ? "+" : ""}
          {change} ({percentage}%)
        </p>
      </div>
    </div>
  );
}