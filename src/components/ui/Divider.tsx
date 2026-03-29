export function Divider({ text }: { text?: string }) {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-gray-300" />
      {text && <span className="text-sm text-gray-500">{text}</span>}
      <div className="flex-1 h-px bg-gray-300" />
    </div>
  );
}