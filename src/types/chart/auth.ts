export type User = {
    username: string;
    role: string;
    fullname?: string;
    desc?: string;
    dob?: string;
    status?: boolean;
}

export type AuthContextProps = {
    user: User | null;
    login: (user: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
}