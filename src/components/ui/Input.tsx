export function Input({ label, ...props }: any) {
  return (
    <div className="space-y-2">
      {label && <label className="text-sm text-gray-700">{label}</label>}
      <input
        className="w-full border rounded-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        {...props} 
      />
    </div>
  );
}