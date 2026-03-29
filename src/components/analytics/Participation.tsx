import Card from "../common/Card";

interface Props {
  progress: number;
}

export default function ParticipationCard({ progress }: Props) {
  return (
    <Card>
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold">Market Participation</h3>
        <span className="text-blue-500 font-semibold">
          {progress}%
        </span>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        2 / 5 Mandatory Days
      </p>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 h-3 rounded-full">
        <div
          className="bg-cyan-500 h-3 rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="text-xs text-gray-400 mt-3">
        Requires 3 more active trading days
      </p>
    </Card>
  );
}