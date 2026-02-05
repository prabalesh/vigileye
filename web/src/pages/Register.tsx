import { useForm } from 'react-hook-form';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Eye, Loader2 } from 'lucide-react';
import { useState } from 'react';

export const Register = () => {
    const { register: registerUser, isAuthenticated } = useAuthStore();
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { register, handleSubmit, watch, formState: { errors } } = useForm();
    const password = watch('password');

    if (isAuthenticated) return <Navigate to="/dashboard" />;

    const onSubmit = async (data: any) => {
        try {
            setIsSubmitting(true);
            setError(null);
            await registerUser(data);
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to create account');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center p-3 bg-purple-600 rounded-2xl mb-4">
                        <Eye size={32} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white">Create Account</h1>
                    <p className="text-slate-400 mt-2">Start tracking errors with Vigil Eye</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                            <input
                                type="text"
                                {...register('name', { required: 'Name is required' })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-600 transition-all"
                                placeholder="John Doe"
                            />
                            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message as string}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                            <input
                                type="email"
                                {...register('email', { required: 'Email is required' })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-600 transition-all"
                                placeholder="name@company.com"
                            />
                            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message as string}</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                                <input
                                    type="password"
                                    {...register('password', {
                                        required: 'Password is required',
                                        minLength: { value: 8, message: 'At least 8 characters' }
                                    })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-600 transition-all"
                                    placeholder="••••••••"
                                />
                                {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message as string}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Confirm</label>
                                <input
                                    type="password"
                                    {...register('confirmPassword', {
                                        validate: value => value === password || 'Passwords do not match'
                                    })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-600 transition-all"
                                    placeholder="••••••••"
                                />
                                {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message as string}</p>}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
                        >
                            {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <span>Create Account</span>}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-sm text-slate-500">
                        Already have an account?{' '}
                        <Link to="/login" className="text-purple-500 hover:underline font-medium">
                            Sign in instead
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};
