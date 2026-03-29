interface Props {
  min: number;
  max: number;
  value: number;
}

export default function RangeSlider({ min, max, value }: Props) {
  const range = max - min;
  const percentage = range > 0 ? Math.min(100, Math.max(0, ((value - min) / range) * 100)) : 50;

  return (
    <div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>{min}</span>
        <span>{max}</span>
      </div>

      <div className="relative h-2 bg-gray-200 rounded mt-2">
        <div
          className="absolute h-2 bg-blue-400 rounded"
          style={{ width: `${percentage}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full"
          style={{ left: `${percentage}%` }}
        />
      </div>
    </div>
  );
}   