import { Mail, Lock, EyeClosed, Eye } from "lucide-react";
import loginIllustration from "/inventoryBg.svg";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usePermissions } from "../context/PermissionContext";
import api from "../services/api";
import { toast } from "sonner";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { refreshPermissions } = usePermissions();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setEmailError("");
    setPasswordError("");
    setLoginError("");

    let hasError = false;

    if (!email.trim()) {
      setEmailError("Email is required");
      hasError = true;
    } else if (!isValidEmail(email)) {
      setEmailError("Please enter a valid email address");
      hasError = true;
    }

    if (!password.trim()) {
      setPasswordError("Password is required");
      hasError = true;
    }

    if (hasError) return;

    setLoading(true);

    try {
      const payload = {
        email,
        password,
      };

      const response = await api.post('/auth/login', payload);
      const { message: responseMessage, data } = response.data;

      if (data && data.token && data.user) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        
        // Get role name from user roles
        const roleName = data.user.Roles && data.user.Roles.length > 0 
          ? data.user.Roles[0].name 
          : 'user';
        localStorage.setItem("role", roleName);

        login(data.user, data.token);

        // Refresh permissions after login with a small delay to ensure token is set
        setTimeout(() => {
          refreshPermissions();
        }, 100);

        toast.success(
          `${responseMessage} - Welcome, ${data.user.full_name || data.user.email || ""}!`
        );

        navigate("/dashboard");
      } else {
        throw new Error("Invalid login response");
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || "Login failed!";

      setLoginError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-white/90">
      {/* LEFT SECTION (Tablet & up) */}
      <div
        data-aos="fade-right"
        className="hidden md:flex lg:w-3/4 max-h-screen overflow-hidden items-center justify-center relative"
      >
        <img
          src={loginIllustration}
          alt="Garment IMS Illustration"
          className="max-h-[96vh] min-h-[50vh] h-auto absolute bottom-0 left-0 object-contain"
        />
      </div>

      {/* RIGHT SECTION — slide-right */}
      <div
        data-aos="fade-left"
        className="flex w-full lg:w-1/4 max-h-screen h-screen items-center justify-center px-3 lg:px-8 lg:py-16 bg-white shadow-[-10px_0_20px_rgba(0,0,0,0.05)] aos-init aos-animate"
      >
        
        <div
          className="w-full max-w-md"
          data-aos="zoom-in"
          data-aos-delay="200"
        >
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img
              src="/inventory_logo.svg"
              alt="logo"
              className="h-24 aspect-square"
            />
          </div>

          {/* Title */}
          <h2
            data-aos="fade-up"
            className="text-center text-md font-bold mb-4"
          >
            Login into your account
          </h2>

          {/* Global Login Error */}
          {loginError && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {loginError}
            </div>
          )}

          {/* Form */}
          <form className="space-y-4 md:space-y-6" onSubmit={handleSubmit}>
            {/* Email */}
            <div data-aos="fade-up" data-aos-delay="100">
              <label htmlFor="email" className="text-sm font-medium">
                Email Address
              </label>
              <div className="relative mt-1">
                <input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  className={`w-full bg-gray-100 rounded-lg border px-4 py-2 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    emailError ? "border-red-500" : "border-gray-300"
                  }`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <div className="bg-blue-600 h-full aspect-square rounded-md absolute right-0 top-0 flex items-center justify-center">
                  <Mail className="text-gray-100" size={20} />
                </div>
              </div>
              {emailError && (
                <p className="mt-1 text-xs text-red-500">{emailError}</p>
              )}
            </div>

            {/* Password */}
            <div data-aos="fade-up" data-aos-delay="200">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <div className="relative mt-1">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className={`w-full rounded-lg bg-gray-100 border px-4 py-2 pr-20 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    passwordError ? "border-red-500" : "border-gray-300"
                  }`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                {/* Eye Icon */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-10 top-1/2 -translate-y-1/2 text-[#1E2772] hover:text-[#1E2772]/80 transition-padding px-3"
                >
                  {showPassword ? <EyeClosed size={20} /> : <Eye size={20} />}
                </button>

                {/* Blue Lock Box */}
                <div className="bg-blue-600 h-full aspect-square rounded-md absolute right-0 top-0 flex items-center justify-center">
                  <Lock className="text-white" size={20} />
                </div>
              </div>

              {passwordError && (
                <p className="mt-1 text-xs text-red-500">{passwordError}</p>
              )}

              <div className="text-right mt-1">
                <a
                  href="#"
                  className="text-xs text-[#1E2772] hover:underline"
                >
                  Forgot Password?
                </a>
              </div>
            </div>

            {/* Login Button */}
            <button
              data-aos="fade-up"
              data-aos-delay="300"
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-[#003893] to-[#005FF9] !text-white font-medium shadow-lg shadow-blue-200 transition-all duration-500 ease-in-out hover:bg-gradient-to-l disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? "Logging in..." : "Login Now"}
            </button>

            {/* Divider */}
            <div
              className="flex items-center gap-3 my-2"
              data-aos="fade-up"
              data-aos-delay="350"
            >
              <div className="grow border-t border-gray-300" />
              <span className="text-xs text-gray-600 font-bold">OR</span>
              <div className="grow border-t border-gray-300" />
            </div>

            {/* Signup Button */}
            <button
              type="button"
              className="w-full py-2.5 rounded-lg border border-blue-600 text-blue-600 font-medium hover:bg-blue-50 transition"
            >
              Signup Now
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;