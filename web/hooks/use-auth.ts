import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function useAuth() {
  const { data: session, status } = useSession();

  return {
    user: session?.user,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    role: (session?.user as any)?.role,
  };
}

export function useAuthActions() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
        return false;
      }

      return true;
    } catch (err) {
      setError("An error occurred during login");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGitHub = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await signIn("github");
    } catch (err) {
      setError("GitHub sign-in failed");
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await signIn("google");
    } catch (err) {
      setError("Google sign-in failed");
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);

    try {
      await signOut({ redirect: false });
      router.push("/");
    } catch (err) {
      setError("Logout failed");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    login,
    loginWithGitHub,
    loginWithGoogle,
    logout,
    isLoading,
    error,
  };
}

export function useRequireAuth() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  if (!isLoading && !isAuthenticated) {
    router.push("/login");
  }

  return { isLoading };
}

export function useRequireRole(allowedRoles: string[]) {
  const router = useRouter();
  const { role, isLoading } = useAuth();

  if (!isLoading && role && !allowedRoles.includes(role)) {
    router.push("/unauthorized");
  }

  return { isLoading };
}
