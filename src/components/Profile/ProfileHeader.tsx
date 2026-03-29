import Avatar from "../UIHome/Avatar";

interface Props {
  name: string;
  email: string;
  avatar: string;
}

export default function ProfileHeader({ name, email, avatar }: Props) {
  return (
    <div className="flex items-center gap-4">
      <Avatar src={avatar} size="lg" />

      <div>
        <h2 className="text-lg font-semibold">{name}</h2>
        <p className="text-sm text-gray-400">{email}</p>
      </div>
    </div>
  );
}