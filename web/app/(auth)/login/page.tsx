import { Suspense } from "react";
import LoginForm from "./login-form";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="p-10 text-center text-sm text-stone-500">
          Loading sign-in…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
