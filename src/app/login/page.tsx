import LoginForm from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-pine text-2xl text-white">
            ⛺
          </div>
          <h1 className="text-2xl font-bold text-ink">CampConnect</h1>
          <p className="text-sm text-ink/60">Operator console</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
