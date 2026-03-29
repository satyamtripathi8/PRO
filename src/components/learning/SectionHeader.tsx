interface Props {
  title: string;
}

export default function SectionHeader({ title }: Props) {
  return (
    <h3 className="text-sm text-gray-500 font-medium">{title}</h3>
  );
}