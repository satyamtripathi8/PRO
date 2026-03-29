import Card from "../common/Card";
type Point = {
  label: string;
  value: number;
};

interface Props {
  data: Point[];
}

export default function DisciplineTrend(_props: Props) {
  return (
    <Card>
      <div className="flex justify-between items-center mb-2">
        <div>
          <h3 className="font-semibold">Discipline Score Trend</h3>
          <p className="text-xs text-gray-400">
            Last 5 Trading Sessions
          </p>
        </div>

        <span className="text-green-600 text-xs bg-green-100 px-2 py-1 rounded">
          +2.1% Avg
        </span>
      </div>

      {/* Chart Placeholder */}
      <div className="h-48 flex items-center justify-center text-gray-400">
        Chart here
      </div>

      <div className="bg-slate-100 text-sm text-gray-500 p-3 rounded mt-4">
        Score variance remains within acceptable deviation limits...
      </div>
    </Card>
  );
}