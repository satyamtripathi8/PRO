import Card from "../common/Card";

interface Props {
  name: string;
  subtitle?: string;
  avatar: string;
  tags: string[];
}

export default function MentorCard({
  name,
  subtitle,
  avatar,
  tags,
}: Props) {
  return (
    <Card className="w-64 p-0 overflow-hidden">
      
      {/* Top banner */}
      <div className="h-24 bg-gray-200" />

      {/* Avatar */}
      <div className="px-4 pb-4 -mt-10">
        <img
          src={avatar}
          alt={name}
          className="w-16 h-16 rounded-full border-4 border-white"
        />

        {/* Info */}
        <div className="mt-3">
          <h3 className="font-semibold">{name}</h3>
          {subtitle && (
            <p className="text-sm text-gray-400">{subtitle}</p>
          )}
        </div>

        {/* Tags */}
        <div className="flex gap-2 mt-3">
          {tags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-3 py-1 bg-blue-100 text-blue-500 rounded-md"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </Card>
  );
}