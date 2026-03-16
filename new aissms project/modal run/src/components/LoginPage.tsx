import React, { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { api } from '../logic/api';

export type User = {
    username: string;
    role: 'admin' | 'viewer';
};

interface LoginPageProps {
    onLogin: (user: User) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState<'admin' | 'viewer'>('viewer');

    const cardRef = useRef<HTMLDivElement>(null);
    const formRef = useRef<HTMLFormElement>(null);
    const titleRef = useRef<HTMLDivElement>(null);

    // Animations
    useEffect(() => {
        const ctx = gsap.context(() => {
            // Reset state for animation
            gsap.set(cardRef.current, { y: 50, opacity: 0 });
            gsap.set([titleRef.current, ...((formRef.current?.children as any) || [])], { y: 20, opacity: 0 });

            // Animate Card
            gsap.to(cardRef.current, {
                y: 0,
                opacity: 1,
                duration: 0.8,
                ease: "power3.out",
                delay: 0.1
            });

            // Animate Content
            gsap.to([titleRef.current, ...((formRef.current?.children as any) || [])], {
                y: 0,
                opacity: 1,
                duration: 0.6,
                stagger: 0.05,
                ease: "power2.out",
                delay: 0.3
            });
        });

        return () => ctx.revert();
    }, [isLogin]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (isLogin) {
                // Login Flow
                const data = await api.login({ username, password });
                onLogin(data.user); // Pass user object with role
            } else {
                // Signup Flow
                if (password !== confirmPassword) {
                    alert("Passwords do not match!");
                    return;
                }

                await api.signup({ username, password, role });
                alert("Signup successful! Please login.");
                setIsLogin(true);
                // Clear sensitive fields
                setPassword('');
                setConfirmPassword('');
            }
        } catch (err: any) {
            alert(err.message || "An error occurred");
        }
    };

    const toggleMode = () => {
        setIsLogin(!isLogin);
        // Optional: Clear fields on toggle
        setUsername('');
        setPassword('');
        setConfirmPassword('');
        setRole('viewer');
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden font-sans">
            {/* Background Image with Dark Overlay */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center"
                style={{
                    backgroundImage: `url('https://aissmscoe.com/wp-content/uploads/2016/05/college-banner.jpg')`,
                }}
            >
                <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"></div>
            </div>

            <div
                ref={cardRef}
                className="relative z-10 w-full max-w-[450px] bg-black/20 backdrop-blur-md rounded-3xl shadow-2xl border border-white/10 p-8 mx-4"
            >
                <div className="text-center mb-8" ref={titleRef}>
                    <h2 className="text-3xl font-bold text-white tracking-tight drop-shadow-md">
                        {isLogin ? 'AISSMS Polytechnic' : 'Join Us'}
                    </h2>
                    <p className="text-slate-200 mt-2 text-sm font-medium tracking-wide drop-shadow-sm">
                        {isLogin ? 'AI Timetable Scheduler' : 'Create your account'}
                    </p>
                </div>

                <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
                    {/* Username */}
                    <div className="space-y-1">
                        <label htmlFor="username" className="block text-xs font-bold text-slate-200 ml-1">
                            Username
                        </label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-4 py-3 bg-white/10 border border-white/10 text-white placeholder-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200"
                            placeholder={isLogin ? "Enter username" : "Choose a username"}
                            required
                        />
                    </div>

                    {/* Password */}
                    <div className="space-y-1">
                        <label htmlFor="password" className="block text-xs font-bold text-slate-200 ml-1">
                            {isLogin ? 'Password' : 'Password'}
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-white/10 border border-white/10 text-white placeholder-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200 tracking-widest"
                            placeholder=".........."
                            required
                        />
                    </div>

                    {/* Signup Fields */}
                    {!isLogin && (
                        <>
                            <div className="space-y-1">
                                <label htmlFor="confirmPassword" className="block text-xs font-bold text-slate-200 ml-1">
                                    Confirm Password
                                </label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-white/10 border border-white/10 text-white placeholder-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200 tracking-widest"
                                    placeholder=".........."
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <label htmlFor="role" className="block text-xs font-bold text-slate-200 ml-1">
                                    I am a...
                                </label>
                                <div className="relative">
                                    <select
                                        id="role"
                                        value={role}
                                        onChange={(e) => setRole(e.target.value as 'admin' | 'viewer')}
                                        className="w-full px-4 py-3 bg-white/10 border border-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200 appearance-none cursor-pointer"
                                    >
                                        <option value="viewer" className="text-slate-800 bg-white">Viewer - View Timetables</option>
                                        <option value="admin" className="text-slate-800 bg-white">Admin - Create & Edit Timetables</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/70">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Submit Button */}
                    <div className="pt-2">
                        <button
                            type="submit"
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-indigo-900/30 hover:shadow-indigo-900/50 transform active:scale-[0.98] transition-all duration-200"
                        >
                            {isLogin ? 'Login to Dashboard' : 'Sign Up'}
                        </button>
                    </div>

                    {/* Toggle Footer */}
                    <div className="text-center mt-6">
                        <p className="text-slate-300 text-sm">
                            {isLogin ? "Don't have an account?" : "Already have an account?"}
                            <button
                                type="button"
                                onClick={toggleMode}
                                className="ml-2 text-white hover:text-indigo-300 font-bold hover:underline transition-colors focus:outline-none"
                            >
                                {isLogin ? "Sign up here" : "Login here"}
                            </button>
                        </p>
                    </div>

                    <div className="text-center mt-8 text-xs text-white/40 font-medium">
                        © 2026 Smart Scheduler
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
