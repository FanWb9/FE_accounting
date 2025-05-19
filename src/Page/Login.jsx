import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
// import { setToken } from '../AuthState/Auth';  
import Logo from "../assets/Fin.png";  
// import GoogleLoginButton from '../components/GoogleButton';


export default function Login() {
  const [Email, setEmail] = useState('');
  const [Password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const token = queryParams.get("token");
  
    console.log("Token from URL:", token);  // Debug log
  
    if (token) {
      try {
        // Coba decode token
        const decoded = jwt_decode(token);
        console.log("Decoded token:", decoded);  // Debug log
        localStorage.setItem("authToken", token);
        navigate("/dashboard");
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    }
  }, [navigate]);
  
  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('https://backendthecore-production.up.railway.app/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ Email, Password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login Failed, Please try again');
      }

      const data = await response.json();
      setToken(data.token);  // Menyimpan token di localStorage
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/dashboard');  // Redirect ke dashboard setelah login berhasil
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  return (
    <section className="h-screen flex flex-col md:flex-row justify-center items-center bg-gray-100 px-4 md:px-0">
      <div className="md:w-1/2 max-w-sm rounded-lg overflow-hidden shadow-lg bg-white p-8 space-y-6">
        <div className="flex justify-center">
          <img src={Logo} alt="Login illustration" className="w-[180px] h-[150px] object-cover " />
        </div>
        
        {error && <p className='text-red-500 text-center'>{error}</p>}
        
        <div className="space-y-4">
          <input
            className="w-full p-3 text-sm border border-gray-300 rounded-lg"
            type="email"
            placeholder="Email Address"
            value={Email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="w-full p-3 text-sm border border-gray-300 rounded-lg"
            type="password"
            placeholder="Password"
            value={Password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div className="flex justify-between text-sm">
            <label className="flex items-center text-gray-600">
              <input type="checkbox" className="mr-2" />
              Remember Me
            </label>
            <a href="#" className="text-blue-600 hover:text-blue-700">Forgot Password?</a>
          </div>

          <div className="text-center">
            <button onClick={handleLogin} className="w-full bg-blue-600 text-white py-3 rounded-lg">Login</button>
          </div>

          <div className="flex items-center my-5">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="mx-4 text-gray-600">Or</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          <div className="flex justify-center">
          <div className="flex justify-center">
      {/* <     GoogleLoginButton /> */}
        </div>

          </div>
        </div>

        <div className="mt-6 text-center text-sm text-gray-600">
          Don't have an account? <a href="/register" className="text-blue-600 hover:underline">Register</a>
        </div>
      </div>
    </section>
  );
}
