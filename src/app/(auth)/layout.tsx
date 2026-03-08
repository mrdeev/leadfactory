export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0A0A12] relative overflow-hidden">
            {/* Animated gradient orbs */}
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-600/20 blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-violet-600/15 blur-[120px] animate-pulse delay-1000" />
            <div className="absolute top-[40%] left-[60%] w-[300px] h-[300px] rounded-full bg-cyan-500/10 blur-[100px] animate-pulse delay-500" />

            <div className="relative z-10 w-full max-w-md mx-4">
                {children}
            </div>
        </div>
    );
}
