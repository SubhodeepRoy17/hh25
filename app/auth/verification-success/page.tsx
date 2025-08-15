export default function VerificationSuccess() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
        <h2 className="font-bold">Email Verified Successfully!</h2>
        <p>Your email has been verified. You can now log in to your account.</p>
      </div>
      <a href="/auth/login" className="text-blue-600 hover:underline">
        Go to Login Page
      </a>
    </div>
  );
}