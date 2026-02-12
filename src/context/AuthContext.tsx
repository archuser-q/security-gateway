import { verifyAdminReq } from "@/apis/admin";
import { req } from "@/config/req";
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
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    expiresIn: string | null;
    tokenType: string | null;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean
}

export const AuthContext = createContext<AuthContextProps | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [refreshToken, setRefreshToken] = useState<string | null>(null);
    const [expiresIn, setExpiresIn] = useState<string | null>(null);
    const [tokenType, setTokenType] = useState<string | null>(null);

    const login = async (username: string, password: string) => {
        const res = await verifyAdminReq(req, username, password);
        setUser({username});
        setAccessToken(res.access_token);
        setRefreshToken(res.refresh_token);
        setExpiresIn(res.expires_in);
        setTokenType(res.token_type);
    }

    const logout = () => {
        setUser(null);
        setAccessToken(null);
        setRefreshToken(null);
        setExpiresIn(null);
        setTokenType(null);
    };

    return (
        <AuthContext.Provider
            value = {{
                user, accessToken, refreshToken, expiresIn, tokenType, 
                login, 
                logout, 
                isAuthenticated: !!accessToken
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