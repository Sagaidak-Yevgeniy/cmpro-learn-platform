
import ResetPasswordForm from "@/components/auth/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen w-full py-12">
      <div className="max-w-md mx-auto px-4">
        <div className="bg-white rounded-lg shadow-xl p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Сброс пароля
          </h1>
          <ResetPasswordForm />
        </div>
      </div>
    </div>
  );
}
