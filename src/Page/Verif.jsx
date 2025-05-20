import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

// Alert component
const Alert = ({ type, message }) => (
  <div className={`flex items-center p-4 rounded-lg mb-4 ${
    type === 'error' 
      ? 'bg-red-50 text-red-800 border border-red-200' 
      : 'bg-green-50 text-green-800 border border-green-200'
  }`}>
    {type === 'error' ? (
      <AlertCircle className="w-5 h-5 mr-2" />
    ) : (
      <CheckCircle className="w-5 h-5 mr-2" />
    )}
    <span className="text-sm font-medium">{message}</span>
  </div>
);

// Background component
const Background = () => (
  <div className="absolute inset-0 overflow-hidden">
    {/* Gradient background */}
    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"></div>
    
    {/* Animated shapes */}
    <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-20 animate-pulse"></div>
    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-indigo-400 to-blue-500 rounded-full opacity-20 animate-pulse"></div>
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-10 animate-pulse"></div>
  </div>
);

export default function Verify() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpTimer, setOtpTimer] = useState(120); // 2 minutes
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // API Base URL
  const API_BASE = 'http://localhost:8080'; // Sesuaikan dengan backend Anda

  // Get email from location state or redirect to register
  useEffect(() => {
    if (location.state && location.state.email) {
      setEmail(location.state.email);
    } else {
      navigate('/register');
    }
  }, [location, navigate]);

  // OTP Timer
  useEffect(() => {
    let interval = null;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer(otpTimer - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  // Clear messages
  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  // Handle OTP Verification
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    clearMessages();
    
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Masukkan kode OTP 6 digit');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          code: otpCode
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message || 'Verifikasi berhasil');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(data.error || 'Verifikasi gagal');
      }
    } catch (err) {
      setError('Koneksi ke server gagal');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Resend OTP
  const handleResendOTP = async () => {
    setIsLoading(true);
    clearMessages();

    try {
      const response = await fetch(`${API_BASE}/auth/resend-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message || 'OTP berhasil dikirim ulang');
        setOtpTimer(120);
        setOtp(['', '', '', '', '', '']);
      } else {
        setError(data.error || 'Gagal mengirim ulang OTP');
      }
    } catch (err) {
      setError('Koneksi ke server gagal');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP input
  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input
    if (value && index < 5) {
      const nextInput = document.querySelector(`input[name="otp-${index + 1}"]`);
      if (nextInput) nextInput.focus();
    }
  };

  // Handle OTP backspace
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.querySelector(`input[name="otp-${index - 1}"]`);
      if (prevInput) prevInput.focus();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      <Background />
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8 backdrop-blur-sm border border-white/20">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifikasi Email</h1>
            <p className="text-gray-600">
              Kami telah mengirim kode 6 digit ke<br />
              <span className="font-semibold text-gray-900">{email}</span>
            </p>
          </div>

          {error && <Alert type="error" message={error} />}
          {success && <Alert type="success" message={success} />}

          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4 text-center">
                Masukkan kode OTP
              </label>
              <div className="flex justify-center space-x-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    name={`otp-${index}`}
                    type="text"
                    maxLength="1"
                    className="w-12 h-12 text-center text-lg font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : null}
              {isLoading ? 'Memverifikasi...' : 'Verifikasi'}
            </button>
          </form>

          <div className="mt-6 text-center">
            {otpTimer > 0 ? (
              <p className="text-gray-600">
                Kirim ulang kode dalam{' '}
                <span className="font-semibold text-blue-600">
                  {Math.floor(otpTimer / 60)}:{(otpTimer % 60).toString().padStart(2, '0')}
                </span>
              </p>
            ) : (
              <div>
                <p className="text-gray-600 mb-2">Tidak menerima kode?</p>
                <button
                  onClick={handleResendOTP}
                  disabled={isLoading}
                  className="text-blue-600 hover:text-blue-700 font-semibold disabled:opacity-50"
                >
                  Kirim Ulang
                </button>
              </div>
            )}
          </div>

          <div className="mt-4 text-center">
            <button
              onClick={() => navigate('/register')}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              Kembali ke pendaftaran
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

