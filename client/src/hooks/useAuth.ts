import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";

interface User {
    id: number;
    name: string;
    email: string;
    image?: string;
}

interface AuthResponse {
    user: User;
    token: string;
}

interface RegisterInput {
    email: string;
    name: string;
    password: string;
}

interface LoginInput {
    email: string;
    password: string;
}

export function useAuth() {
    const queryClient = useQueryClient();
    const [, setLocation] = useLocation();

    // Get current user
    const { data: user, isLoading, error } = useQuery<User | null>({
        queryKey: ["auth", "me"],
        queryFn: async () => {
            try {
                const res = await fetch("/api/auth/me", {
                    credentials: "include",
                });
                if (!res.ok) {
                    if (res.status === 401) return null;
                    throw new Error("Failed to fetch user");
                }
                return await res.json();
            } catch (err) {
                return null;
            }
        },
        retry: false,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    // Register mutation
    const registerMutation = useMutation({
        mutationFn: async (input: RegisterInput): Promise<AuthResponse> => {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(input),
                credentials: "include",
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Registration failed");
            }

            return await res.json();
        },
        onSuccess: (data) => {
            queryClient.setQueryData(["auth", "me"], data.user);
            setLocation("/dashboard");
        },
    });

    // Login mutation
    const loginMutation = useMutation({
        mutationFn: async (input: LoginInput): Promise<AuthResponse> => {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(input),
                credentials: "include",
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Login failed");
            }

            return await res.json();
        },
        onSuccess: (data) => {
            queryClient.setQueryData(["auth", "me"], data.user);
            setLocation("/dashboard");
        },
    });

    // Logout mutation
    const logoutMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch("/api/auth/logout", {
                method: "POST",
                credentials: "include",
            });

            if (!res.ok) {
                throw new Error("Logout failed");
            }
        },
        onSuccess: () => {
            queryClient.setQueryData(["auth", "me"], null);
            queryClient.clear();
            setLocation("/login");
        },
    });

    return {
        user,
        isLoading,
        isAuthenticated: !!user,
        error,
        register: registerMutation.mutate,
        login: loginMutation.mutate,
        logout: logoutMutation.mutate,
        isRegistering: registerMutation.isPending,
        isLoggingIn: loginMutation.isPending,
        isLoggingOut: logoutMutation.isPending,
        registerError: registerMutation.error,
        loginError: loginMutation.error,
    };
}
