export default function VerificationFailed() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        <h2 className="font-bold">Verification Failed</h2>
        <p>The verification link is invalid or has expired.</p>
      </div>
      <a href="/auth/register" className="text-blue-600 hover:underline">
        Try Registering Again
      </a>
    </div>
  );
}