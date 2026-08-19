import type { AuthContextProps, User } from "@/types/chart/auth";
import { createContext, useContext, useState, type ReactNode } from "react";

export const AuthContext = createContext<AuthContextProps | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    // TẠM THỜI - chỉ để test giao diện lúc chưa có backend /admins/login
    // thật. Đừng commit lên git chung, đổi lại `useState<User | null>(null)`
    // khi có backend xác thực thật.
    const [user, setUser] = useState<User | null>({
        id: 'dev-bypass',
        username: 'dev',
        role: 'admin',
    });

    const login = (user: User) => setUser(user);
    const logout = () => setUser(null);

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated: Boolean(user) }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error();
    return ctx;
};
