import { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../utils/cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'glass' | 'soft';
    children: ReactNode;
}

export function Card({ className, variant = 'default', children, ...props }: CardProps) {
    const variants = {
        default: 'bg-white border border-gray-200 shadow-lg',
        glass: 'bg-white/80 backdrop-blur-lg border border-white/20 shadow-xl',
        soft: 'bg-gray-50/80 border border-gray-100 shadow-sm',
    };

    return (
        <div
            className={cn(
                'rounded-2xl p-6 transition-all duration-200',
                variants[variant],
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
}

export function CardHeader({ className, children, ...props }: CardHeaderProps) {
    return (
        <div className={cn('mb-4', className)} {...props}>
            {children}
        </div>
    );
}

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
    children: ReactNode;
}

export function CardTitle({ className, children, ...props }: CardTitleProps) {
    return (
        <h3 className={cn('text-xl font-bold text-gray-900', className)} {...props}>
            {children}
        </h3>
    );
}

export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
}

export function CardContent({ className, children, ...props }: CardContentProps) {
    return (
        <div className={cn('', className)} {...props}>
            {children}
        </div>
    );
}
