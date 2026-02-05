import type { ErrorLevel } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface ErrorBadgeProps {
    level: ErrorLevel;
    className?: string;
}

export const ErrorBadge = ({ level, className }: ErrorBadgeProps) => {
    const styles = {
        error: 'bg-red-500/10 text-red-500 border-red-500/20',
        warn: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
        info: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    };

    return (
        <span className={cn(
            'px-2 py-0.5 rounded-full text-xs font-medium border capitalize',
            styles[level],
            className
        )}>
            {level}
        </span>
    );
};
