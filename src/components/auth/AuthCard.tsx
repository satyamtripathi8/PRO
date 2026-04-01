export default function AuthCard({ title, description, children }: any) {
  return (
    <div className="w-full max-w-md px-6 sm:px-10 bg-white rounded-3xl shadow-lg p-6 sm:p-8">
      <h2 className="text-xl sm:text-2xl font-semibold mb-2 text-center ">{title}</h2>
      {description && (
        <p className="text-gray-500 mb-4 sm:mb-6 text-sm sm:text-base text-center">{description}</p>
      )}
      {children}
    </div>
  );
}