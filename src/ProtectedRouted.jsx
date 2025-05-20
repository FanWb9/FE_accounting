import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

const ProtectedRoute = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
   const token = sessionStorage.getItem('token');
const userData = sessionStorage.getItem('user');


    try {
      const user = JSON.parse(userData);

      // Pastikan token dan user memiliki data yang valid
      if (token && user && user.id && user.email) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      // Jika user tidak bisa di-parse atau error
      console.error("Error parsing user data:", error);
      setIsAuthenticated(false);
    }

    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
