"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <h2 className="text-xl font-bold text-red-400 mb-4">
          Something went wrong
        </h2>
        <p className="text-slate-400 mb-6">{error.message}</p>
        <button
          onClick={reset}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
