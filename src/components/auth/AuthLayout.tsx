import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-hero relative">

      
      <div className="w-full max-w-md">
        
        {children}
      </div>
    </div>
  );
};
