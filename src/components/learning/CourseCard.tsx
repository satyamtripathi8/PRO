import Card from "../common/Card";
import { Layers, Clock } from "lucide-react";

interface Props {
  title: string;
  description: string;
  image: string;
  progress: number;
  modules: number;
  duration: string;
  level?: string;
  onResume?: () => void;
}

export default function CourseCard({
  title,
  description,
  image,
  progress,
  modules,
  duration,
  level = "Beginner Friendly",
  onResume,
}: Props) {
  return (
    <Card className="flex gap-5 items-center">
      {/* Image */}
      <img
        src={image}
        alt={title}
        className="w-40 h-28 object-cover rounded-lg"
      />

      {/* Content */}
      <div className="flex-1">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold">{title}</h3>
          <span className="text-sm text-gray-500">
            {progress}% Complete
          </span>
        </div>

        <p className="text-sm text-gray-500 mt-1">{description}</p>

        {/* Meta */}
        <div className="flex gap-6 mt-3 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Layers size={14} /> {modules} Modules
          </div>

          <div>{level}</div>

          <div className="flex items-center gap-1">
            <Clock size={14} /> {duration}
          </div>
        </div>

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