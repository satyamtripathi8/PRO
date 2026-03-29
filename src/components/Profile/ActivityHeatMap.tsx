import clsx from "clsx";

type Activity = {
  id: number;
  level: number;
};

interface Props {
  data: Activity[];
}

export default function ActivityHeatMap({ data }: Props) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      
      <div className="flex gap-1 flex-wrap max-w-[900px]">
        {data.map((item) => (
          <div
            key={item.id}
            className={clsx(
              "w-3 h-3 rounded-sm",
              item.level === 0 && "bg-slate-200",
              item.level === 1 && "bg-blue-200",
              item.level === 2 && "bg-blue-300",
              item.level === 3 && "bg-blue-400",
              item.level === 4 && "bg-blue-600"
            )}
          />
        ))}
      </div>

    </div>
  );
}