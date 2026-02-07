import { 
    createContext, 
    useContext, 
    useState, 
    type ReactNode 
} from "react";

type User = {
    username: string,
}
type AuthContextProps = {
    user: User | null,
    login: (user: User) => void;
    logout: () => void,
    isAuthenticated: boolean,
}

export const AuthContext = createContext<AuthContextProps | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);

    const login = (user: User) => {
        setUser(user);
    }

    const logout = () => {
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value = {{
                user, login, logout, isAuthenticated: Boolean(user)
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx){
        throw new Error()
    }
    return ctx;
}