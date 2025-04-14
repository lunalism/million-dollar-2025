// app/admin/components/AdminLogin.tsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AdminLoginProps {
    email: string;
    password: string;
    setEmail: (email: string) => void;
    setPassword: (password: string) => void;
    handleLogin: () => Promise<void>;
}

export default function AdminLogin({ email, password, setEmail, setPassword, handleLogin }: AdminLoginProps) {
    return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="max-w-md w-full p-6 border rounded-lg shadow-lg">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">
                    Admin Login
                </h2>
                <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email"
                className="mb-4"
                />
                <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="mb-4"
                />
                <Button onClick={handleLogin} className="w-full bg-[#0F4C81] hover:bg-[#1A5A96]">
                    Login
                </Button>
            </div>
        </div>
    );
}