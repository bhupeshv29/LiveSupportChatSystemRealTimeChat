export default function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold">403</h1>

        <p className="mt-2 text-gray-500">
          You are not allowed to access this page.
        </p>
      </div>
    </div>
  );
}
