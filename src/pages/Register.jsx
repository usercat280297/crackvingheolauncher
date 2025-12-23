import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import { Loader, Check, Eye, EyeOff, ArrowLeft, AlertCircle } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    passwordConfirm: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showTermsPopup, setShowTermsPopup] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [pendingProvider, setPendingProvider] = useState(null);

  // Listen for OAuth callback from Electron
  useEffect(() => {
    // Check if running in Electron
    if (window.electron && window.electron.onOAuthCallback) {
      window.electron.onOAuthCallback((data) => {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        toast.success('✅ Registration successful!');
        setTimeout(() => navigate('/'), 500);
      });
    }
  }, [navigate, toast]);

  // Calculate password strength
  const calculatePasswordStrength = (pwd) => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (pwd.length >= 12) strength++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[!@#$%^&*]/.test(pwd)) strength++;
    return Math.min(strength, 5);
  };

  const getPasswordStrengthColor = () => {
    const colors = {
      0: 'bg-gray-600',
      1: 'bg-red-500',
      2: 'bg-orange-500',
      3: 'bg-yellow-500',
      4: 'bg-lime-500',
      5: 'bg-green-500'
    };
    return colors[passwordStrength] || 'bg-gray-600';
  };

  const getPasswordStrengthText = () => {
    const texts = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
    return texts[passwordStrength] || 'Very Weak';
  };

  const passwordsMatch = formData.password === formData.passwordConfirm;
  const isFormValid = 
    formData.username.length >= 3 &&
    /\S+@\S+\.\S+/.test(formData.email) &&
    formData.password.length >= 8 &&
    passwordStrength >= 2 &&
    passwordsMatch;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Calculate strength for password field
    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));
    }

    // Clear error when typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isFormValid) {
      toast.error('Please fill all fields correctly');
      return;
    }

    // Show terms popup for regular registration
    setPendingProvider('register');
    setShowTermsPopup(true);
  };

  const confirmRegister = async () => {
    setIsLoading(true);
    setErrors({});
    setShowTermsPopup(false);

    try {
      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }
      
      toast.success('✅ Registration successful! Please login.');
      setTimeout(() => navigate('/login'), 1000);
      
    } catch (error) {
      const errorMsg = error.message || 'Registration failed';
      setErrors({ submit: errorMsg });
      toast.error('❌ ' + errorMsg);
    } finally {
      setIsLoading(false);
      setTermsAccepted(false);
      setPendingProvider(null);
    }
  };

  const handleSocialLogin = (provider) => {
    // Show popup before redirect
    setPendingProvider(provider);
    setShowTermsPopup(true);
  };

  const confirmSocialLogin = async () => {
    if (!termsAccepted || !pendingProvider) return;
    
    setShowTermsPopup(false);
    
    if (pendingProvider === 'register') {
      confirmRegister();
    } else {
      // Check if running in Electron
      if (window.electron && window.electron.openOAuth) {
        // Open in external browser
        await window.electron.openOAuth(pendingProvider);
      } else {
        // Fallback for web version
        const width = 500;
        const height = 600;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;
        
        window.open(
          `http://localhost:3000/api/auth/${pendingProvider}`,
          'OAuth Login',
          `width=${width},height=${height},left=${left},top=${top}`
        );
      }
    }
    
    setTermsAccepted(false);
    setPendingProvider(null);
  };

  return (
    <>
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-red-950/5 to-black" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl opacity-20 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900/80 hover:bg-gray-800 transition border border-gray-700 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition" />
          <span className="text-sm font-medium">Back</span>
        </button>

        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-red-400 via-red-500 to-red-600 bg-clip-text text-transparent mb-3">
              Create Account
            </h1>
            <p className="text-gray-400 text-lg">
              Join thousands of gamers worldwide
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl space-y-6">
            {/* Error Alert */}
            {errors.submit && (
              <div className="flex gap-3 p-4 bg-red-950/40 border border-red-500/50 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-300">{errors.submit}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username */}
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">
                  Username <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Pick a cool username"
                  minLength={3}
                  className={`w-full bg-gray-800/50 border-2 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none transition ${
                    errors.username 
                      ? 'border-red-500 focus:border-red-400 focus:ring-2 focus:ring-red-500/30' 
                      : formData.username.length >= 3
                      ? 'border-green-500/50 focus:border-green-400 focus:ring-2 focus:ring-green-500/30'
                      : 'border-gray-700 focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20'
                  }`}
                  required
                />
                <p className="text-xs text-gray-400 mt-1">3+ characters</p>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">
                  Email <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  className={`w-full bg-gray-800/50 border-2 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none transition ${
                    errors.email
                      ? 'border-red-500 focus:border-red-400 focus:ring-2 focus:ring-red-500/30'
                      : /\S+@\S+\.\S+/.test(formData.email)
                      ? 'border-green-500/50 focus:border-green-400 focus:ring-2 focus:ring-green-500/30'
                      : 'border-gray-700 focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20'
                  }`}
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">
                  Password <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min. 8 characters with mix"
                    minLength={8}
                    className={`w-full bg-gray-800/50 border-2 rounded-lg px-4 py-3 pr-12 text-white placeholder-gray-500 focus:outline-none transition ${
                      errors.password
                        ? 'border-red-500 focus:border-red-400 focus:ring-2 focus:ring-red-500/30'
                        : formData.password.length >= 8
                        ? 'border-green-500/50 focus:border-green-400 focus:ring-2 focus:ring-green-500/30'
                        : 'border-gray-700 focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20'
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-200 transition"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>

                {/* Password Strength Bar */}
                {formData.password && (
                  <div className="mt-3 space-y-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div
                          key={i}
                          className={`h-2 flex-1 rounded-full transition ${
                            i <= passwordStrength ? getPasswordStrengthColor() : 'bg-gray-700'
                          }`}
                        />
                      ))}
                    </div>
                    <p className={`text-xs font-semibold ${
                      passwordStrength === 5 ? 'text-green-400' : 
                      passwordStrength === 4 ? 'text-lime-400' : 
                      passwordStrength === 3 ? 'text-yellow-400' : 
                      passwordStrength === 2 ? 'text-orange-400' : 
                      'text-red-400'
                    }`}>
                      Strength: {getPasswordStrengthText()}
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">
                  Confirm Password <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPasswordConfirm ? 'text' : 'password'}
                    name="passwordConfirm"
                    value={formData.passwordConfirm}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    className={`w-full bg-gray-800/50 border-2 rounded-lg px-4 py-3 pr-12 text-white placeholder-gray-500 focus:outline-none transition ${
                      formData.passwordConfirm
                        ? passwordsMatch
                          ? 'border-green-500 focus:border-green-400 focus:ring-2 focus:ring-green-500/30'
                          : 'border-red-500 focus:border-red-400 focus:ring-2 focus:ring-red-500/30'
                        : 'border-gray-700 focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20'
                    }`}
                    required
                  />
                  {formData.passwordConfirm && passwordsMatch && (
                    <Check className="absolute right-3 top-3.5 w-5 h-5 text-green-400" />
                  )}
                  {formData.passwordConfirm && !passwordsMatch && (
                    <AlertCircle className="absolute right-3 top-3.5 w-5 h-5 text-red-400" />
                  )}
                </div>
                {formData.passwordConfirm && !passwordsMatch && (
                  <p className="text-xs text-red-400 mt-1">❌ Passwords don't match</p>
                )}
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start gap-3 p-4 bg-gray-800/30 rounded-lg border border-gray-700">
                <input
                  type="checkbox"
                  id="terms"
                  className="w-4 h-4 mt-0.5 bg-gray-700 border border-gray-600 rounded cursor-pointer checked:bg-red-600 checked:border-red-500 transition"
                  required
                />
                <label htmlFor="terms" className="text-sm text-gray-300 cursor-pointer">
                  I agree to the <span className="text-red-400 font-semibold">Terms of Service</span> and <span className="text-red-400 font-semibold">Privacy Policy</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !isFormValid}
                className={`w-full py-3 rounded-lg font-semibold text-lg transition flex items-center justify-center gap-2 shadow-lg ${
                  isFormValid && !isLoading
                    ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-red-500/30'
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  '✨ Create Account'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-black text-gray-400">or continue with</span>
              </div>
            </div>

            {/* Social Login */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => handleSocialLogin('google')}
                disabled={isLoading}
                className="w-full py-3 px-4 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 rounded-lg font-semibold text-gray-800 transition flex items-center justify-center gap-3 shadow-sm"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span>Google</span>
              </button>

              <button
                type="button"
                onClick={() => handleSocialLogin('github')}
                disabled={isLoading}
                className="w-full py-3 px-4 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-700 rounded-lg font-semibold text-white transition flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                <span>GitHub</span>
              </button>

              <button
                type="button"
                onClick={() => handleSocialLogin('steam')}
                disabled={isLoading}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed border border-blue-600 rounded-lg font-semibold text-white transition flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.624 0 11.979-5.354 11.979-11.979C23.958 5.354 18.603.001 11.979.001z"/>
                </svg>
                <span>Steam</span>
              </button>
            </div>

            {/* Login Link */}
            <div className="pt-4 text-center border-t border-gray-700">
              <p className="text-gray-400">
                Already have an account?{' '}
                <Link to="/login" className="text-red-400 hover:text-red-300 font-semibold transition-colors">
                  Log in here →
                </Link>
              </p>
            </div>
          </div>

          {/* Footer Info */}
          <p className="text-center text-xs text-gray-500 mt-6">
            By registering, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>

    {/* Terms Popup */}
    {showTermsPopup && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-3xl font-bold text-white">G</span>
            </div>
          </div>
          
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-2">Continue with Google</h3>
          <p className="text-gray-600 text-sm text-center mb-6">
            By continuing, you agree to our <span className="font-semibold text-gray-900">Terms of Service</span> and <span className="font-semibold text-gray-900">Privacy Policy</span>.
          </p>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="popupTerms"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="w-5 h-5 mt-0.5 accent-red-600 cursor-pointer"
              />
              <label htmlFor="popupTerms" className="text-sm text-gray-700 cursor-pointer leading-relaxed">
                I agree to the Terms of Service and Privacy Policy
              </label>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowTermsPopup(false);
                setTermsAccepted(false);
                setPendingProvider(null);
              }}
              className="flex-1 py-3 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition"
            >
              Cancel
            </button>
            <button
              onClick={confirmSocialLogin}
              disabled={!termsAccepted}
              className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition shadow-lg shadow-red-500/30"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
