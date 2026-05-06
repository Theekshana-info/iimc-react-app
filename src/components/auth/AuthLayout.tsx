import React from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';
import iimcLogo from '@/assets/iimc-logo.jpg';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-hero relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <img
            src={iimcLogo}
            alt="IIMC Logo"
            className="h-20 w-20 rounded-xl object-cover shadow-lg"
          />
        </div>
        
        {children}
      </div>
    </div>
  );
};
