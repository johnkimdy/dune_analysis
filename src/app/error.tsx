"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <h2 className="text-xl font-bold text-red-400 mb-4">
          Something went wrong
        </h2>
        <p className="text-[var(--secondary)] mb-6">{error.message}</p>
        <button
          onClick={reset}
          className="px-6 py-2 bg-[var(--accent)] text-white rounded-lg hover:opacity-90 transition-all duration-200"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
