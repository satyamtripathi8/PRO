import Card from "../common/Card";
import RangeSlider from "./RangeSlider";

export default function ChartCard() {
  return (
    <Card className="space-y-4">
      {/* Header */}
      <div>
        <p className="text-sm text-gray-500">Logo Aequs</p>
        <h2 className="text-xl font-semibold">₹ 151.22</h2>
        <p className="text-green-600 text-sm">+18.81 (13.44%) 1D</p>
      </div>

      {/* Fake Chart */}
      <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center">
        Chart Placeholder
      </div>

      {/* Time Filters */}
      <div className="flex justify-between text-xs text-gray-500">
        {["1D", "1W", "1M", "3M", "6M", "1Y", "5Y", "All"].map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>

      {/* About */}
      <h3 className="font-semibold text-center">About</h3>

      <div className="space-y-4">
        <div>
          <p className="text-xs text-gray-500">Today's Low</p>
          <RangeSlider min={145.45} max={185.23} value={160} />
        </div>

        <div>
          <p className="text-xs text-gray-500">52 Week Low</p>
          <RangeSlider min={135.45} max={210.23} value={170} />
        </div>
      </div>
    </Card>
  );
}