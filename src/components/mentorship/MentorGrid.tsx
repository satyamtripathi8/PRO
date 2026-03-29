import MentorCard from "./MentorCard";

interface Mentor {
  id: number;
  name: string;
  subtitle?: string;
  avatar: string;
  tags: string[];
}

interface Props {
  data: Mentor[];
}

export default function MentorGrid({ data }: Props) {
  if (!data.length) {
    return (
      <p className="text-gray-400 text-sm">No mentors found</p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {data.map((mentor) => (
        <MentorCard key={mentor.id} {...mentor} />
      ))}
    </div>
  );
}