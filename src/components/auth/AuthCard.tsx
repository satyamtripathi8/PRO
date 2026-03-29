export default function AuthCard({ title, description, children }: any) {
  return (
    <div className="w-fit px-10 bg-white rounded-3xl shadow-lg p-8">
      <h2 className="text-2xl font-semibold mb-2 text-center ">{title}</h2>
      {description && (
        <p className="text-gray-500 mb-6">{description}</p>
      )}
      {children}
    </div>
  );
}