import Card from "../common/Card";
import { Play } from "lucide-react";

interface Props {
  title: string;
  description: string;
  image: string;
  progress: number;
  module: string;
  onResume?: () => void;
}

export default function ContinueLearningCard({
  title,
  description,
  image,
  progress,
  module,
  onResume,
}: Props) {
  return (
    <Card className="flex gap-5 items-center">
      {/* Image */}
      <div className="relative">
        <img
          src={image}
          alt={title}
          className="w-48 h-28 object-cover rounded-lg"
        />

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white p-2 rounded-full shadow">
            <Play size={16} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        <p className="text-xs text-blue-500">{module}</p>

        <div className="flex justify-between items-center">
          <h2 className="font-semibold">{title}</h2>
          <span className="text-sm text-gray-500">
            {progress}% Complete
          </span>
        </div>

        <p className="text-sm text-gray-500 mt-1">{description}</p>

        <button
          onClick={onResume}
          className="mt-3 px-4 py-1.5 bg-orange-400 hover:bg-orange-500 text-white text-sm rounded-md"
        >
          Resume Course
        </button>
      </div>
    </Card>
  );
}