import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, X, Mail } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import {
  loginSchema,
  forgotPasswordSchema,
  resetPasswordWithOtpSchema,
  registerStep1Schema,
  registerStep2Schema,
  registerSchema,
} from "@/lib/validations/auth";
import { z } from "zod";
import { Icon } from "@iconify/react";
import {
  login as apiLogin,
  sendOtpRegister,
  verifyOtp,
  register as apiRegister,
  sendOtpForgotPassword,
  forgotPassword,
  loginWithGoogle,
} from "@/apis/auth.api";
import { useUserState } from "@/recoils/user.state";
import {
  showApiError,
  showApiSuccess,
  showError,
  showSuccess,
} from "@/utils/toast.utils";

interface AuthPopupProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?:
    | "login"
    | "register"
    | "forgot-password"
    | "verify-otp"
    | "reset-password";
}

export function AuthPopup({
  isOpen,
  onClose,
  initialMode = "login",
}: AuthPopupProps) {
  const { mode, openAuthPopup } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [, setRecoilUser] = useUserState();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    password: "",
    confirmPassword: "",
    email: "",
    address: "",
    referralCode: "",
    otp: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // State chung cho OTP flow
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [canResendOtp, setCanResendOtp] = useState(true);
  const [currentOtpMode, setCurrentOtpMode] = useState<
    "register" | "forgot-password" | null
  >(null);
  const [resetEmail, setResetEmail] = useState("");

  const { login } = useAuth();

  // THÊM PHẦN NÀY - Handler cho Google Login
  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      setIsLoading(true);

      const response = await loginWithGoogle(credentialResponse.credential);

      if (response && response.access_token) {
        const userData = response.result || {};
        login(userData, response.access_token);
        setRecoilUser(userData);
        showApiSuccess("Đăng nhập thành công!");
        onClose();
      }
    } catch (error: any) {
      // Backend đã trả về message chính xác, chỉ cần hiển thị
      showApiError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    showApiError({ message: "Không thể kết nối với Google" });
  };
  // Reset form data when mode changes or popup opens/closes
  useEffect(() => {
    setFormData({
      name: "",
      phone: "",
      password: "",
      confirmPassword: "",
      email: "",
      address: "",
      referralCode: "",
      otp: "",
    });
    setErrors({});
    setIsOtpSent(false);
    setIsOtpVerified(false);
    setOtpTimer(0);
    setCanResendOtp(true);
    setCurrentOtpMode(null);
    setResetEmail("");
  }, [mode, isOpen]);

  // OTP Timer effect (dùng chung)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => {
          if (prev <= 1) {
            setCanResendOtp(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  const validateForm = (schema?: z.ZodSchema) => {
    try {
      const schemaToUse = schema || getValidationSchema();
      schemaToUse.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path) {
            newErrors[err.path[0]] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const getValidationSchema = () => {
    switch (mode) {
      case "login":
        return loginSchema;
      case "forgot-password":
        return forgotPasswordSchema;
      default:
        return loginSchema;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "register") {
      await handleRegisterFlow();
    } else if (mode === "forgot-password") {
      await handleForgotPasswordFlow();
    } else {
      await handleOtherForms();
    }
  };

  const handleRegisterFlow = async () => {
    if (!isOtpSent) {
      // Step 1: Validate và gửi OTP
      const validationResult = registerStep1Schema.safeParse({
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });

      if (!validationResult.success) {
        const newErrors: Record<string, string> = {};
        validationResult.error.errors.forEach((err) => {
          if (err.path) {
            newErrors[err.path[0]] = err.message;
          }
        });
        setErrors(newErrors);
        const firstError =
          validationResult.error.errors[0]?.message ||
          "Vui lòng kiểm tra lại thông tin";
        showError(firstError);
        return;
      }

      setErrors({});

      // Tiếp tục gửi OTP...
      setIsLoading(true);
      try {
        await sendOtpRegister(formData.email);
        setIsOtpSent(true);
        setOtpTimer(60);
        setCanResendOtp(false);
        setCurrentOtpMode("register");
        showSuccess("Mã OTP đã được gửi đến email của bạn!");
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message || "Có lỗi xảy ra khi gửi OTP";
        setErrors({ submit: errorMessage });
        showError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Step 2: Verify OTP và hoàn tất đăng ký
      // QUAN TRỌNG: Validate lại toàn bộ form data, không chỉ OTP
      try {
        // Validate toàn bộ thông tin đăng ký
        registerSchema.parse({
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          otp: formData.otp,
          referralCode: formData.referralCode || undefined,
        });
        setErrors({});
      } catch (error) {
        if (error instanceof z.ZodError) {
          const newErrors: Record<string, string> = {};
          error.errors.forEach((err) => {
            if (err.path) {
              newErrors[err.path[0]] = err.message;
            }
          });
          setErrors(newErrors);
          return;
        }
      }

      setIsLoading(true);
      try {
        await verifyOtp(formData.email, formData.otp);

        const userData = {
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          otp: formData.otp,
        };

        await apiRegister(userData);
        showSuccess("Đăng ký thành công!");

        // Auto login
        try {
          const loginResponse = await apiLogin({
            email: formData.email,
            password: formData.password,
          });

          if (loginResponse && loginResponse.access_token) {
            const userData = loginResponse.result || {};
            login(userData, loginResponse.access_token);
            setRecoilUser(userData);
          }
        } catch (loginErr) {
          console.error("Auto login failed:", loginErr);
          openAuthPopup("login");
        }

        onClose();
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message || "Có lỗi xảy ra khi đăng ký";
        setErrors({ submit: errorMessage });
        showError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleForgotPasswordFlow = async () => {
    if (!isOtpSent) {
      // Bước 1: Gửi OTP (giữ nguyên)
      try {
        forgotPasswordSchema.parse({ email: formData.email });
        setErrors({});
      } catch (error) {
        if (error instanceof z.ZodError) {
          const newErrors: Record<string, string> = {};
          error.errors.forEach((err) => {
            if (err.path) {
              newErrors[err.path[0]] = err.message;
            }
          });
          setErrors(newErrors);
          showError(
            error.errors[0]?.message || "Vui lòng kiểm tra lại thông tin"
          );
          return;
        }
      }

      setIsLoading(true);
      try {
        await sendOtpForgotPassword(formData.email);
        setResetEmail(formData.email);
        setIsOtpSent(true);
        setOtpTimer(60);
        setCanResendOtp(false);
        setCurrentOtpMode("forgot-password");
        showSuccess("Mã OTP đã được gửi đến email của bạn!");
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message || "Có lỗi xảy ra khi gửi OTP";
        setErrors({ submit: errorMessage });
        showError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Bước 2: Xác thực OTP và đặt lại mật khẩu
      const resetData = {
        email: resetEmail,
        otp: formData.otp,
        newPassword: formData.password,
        confirmPassword: formData.confirmPassword,
      };

      try {
        resetPasswordWithOtpSchema.parse(resetData);
        setErrors({});
      } catch (error) {
        if (error instanceof z.ZodError) {
          const newErrors: Record<string, string> = {};
          error.errors.forEach((err) => {
            if (err.path) {
              newErrors[err.path[0]] = err.message;
            }
          });
          setErrors(newErrors);
          return;
        }
      }

      setIsLoading(true);
      try {
        // SỬA LẠI: Gửi đủ các trường theo yêu cầu của backend
        await forgotPassword({
          email: resetEmail,
          otp: formData.otp,
          newPassword: formData.password,
          confirmPassword: formData.confirmPassword, // THÊM TRƯỜNG NÀY
        });

        showSuccess("Mật khẩu đã được đặt lại thành công!");
        openAuthPopup("login");
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message || "Có lỗi xảy ra khi đặt lại mật khẩu";
        setErrors({ submit: errorMessage });
        showError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleOtherForms = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      if (mode === "login") {
        const response = await apiLogin({
          email: formData.phone,
          password: formData.password,
        });

        if (response && response.access_token) {
          const userData = response.result || {};
          login(userData, response.access_token);
          setRecoilUser(userData);
          showSuccess("Đăng nhập thành công!");
          onClose();
        } else {
          throw new Error("Định dạng phản hồi không hợp lệ");
        }
      }
    } catch (err: any) {
      showApiError(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Hàm resend OTP dùng chung
  const handleResendOtp = async () => {
    if (!canResendOtp) return;

    const emailToUse =
      currentOtpMode === "forgot-password" ? resetEmail : formData.email;
    if (!emailToUse) return;

    setIsLoading(true);
    try {
      if (currentOtpMode === "forgot-password") {
        await sendOtpForgotPassword(emailToUse);
      } else {
        await sendOtpRegister(emailToUse);
      }
      setOtpTimer(60);
      setCanResendOtp(false);
      showSuccess("Mã OTP mới đã được gửi!");
    } catch (err: any) {
      showApiError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const renderRegisterForm = () => {
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            disabled={isOtpSent}
            className={`mt-1 block w-full rounded-md shadow-sm py-2.5 px-3 focus:ring-green-500 focus:border-green-500 ${
              errors.email ? "border-red-500" : "border-gray-300"
            } ${isOtpSent ? "bg-gray-100" : ""}`}
            required
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Số điện thoại <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            disabled={isOtpSent}
            className={`mt-1 block w-full rounded-md shadow-sm py-2.5 px-3 focus:ring-green-500 focus:border-green-500 ${
              errors.phone ? "border-red-500" : "border-gray-300"
            } ${isOtpSent ? "bg-gray-100" : ""}`}
            required
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Mật khẩu <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              disabled={isOtpSent}
              className={`mt-1 block w-full rounded-md shadow-sm py-2.5 px-3 focus:ring-green-500 focus:border-green-500 pr-10 ${
                errors.password ? "border-red-500" : "border-gray-300"
              } ${isOtpSent ? "bg-gray-100" : ""}`}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isOtpSent}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password}</p>
          )}
          {!isOtpSent && (
            <p className="mt-1 text-xs text-gray-500">
              Mật khẩu phải có ít nhất 6 ký tự, bao gồm chữ hoa, chữ thường và
              số
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Xác nhận mật khẩu <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              disabled={isOtpSent}
              className={`mt-1 block w-full rounded-md shadow-sm py-2.5 px-3 focus:ring-green-500 focus:border-green-500 pr-10 ${
                errors.confirmPassword ? "border-red-500" : "border-gray-300"
              } ${isOtpSent ? "bg-gray-100" : ""}`}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={isOtpSent}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">
              {errors.confirmPassword}
            </p>
          )}
        </div>

        {isOtpSent && (
          <div className="border-t pt-4">
            <div className="mb-2 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-700 flex items-center">
                <Mail size={16} className="mr-2" />
                Mã OTP đã được gửi đến email {formData.email}
              </p>
            </div>

            <label className="block text-sm font-medium text-gray-700">
              Mã OTP <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                name="otp"
                value={formData.otp}
                onChange={handleInputChange}
                maxLength={6}
                className={`mt-1 flex-1 block w-full rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 ${
                  errors.otp ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Nhập mã 6 số"
                required
                autoFocus
              />
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={!canResendOtp || isLoading}
                className={`mt-1 px-4 py-2 text-sm font-medium rounded-md border transition-colors ${
                  canResendOtp && !isLoading
                    ? "border-green-500 text-green-600 hover:bg-green-50"
                    : "border-gray-300 text-gray-400 cursor-not-allowed bg-gray-50"
                }`}
              >
                {otpTimer > 0 ? `Gửi lại (${otpTimer}s)` : "Gửi lại OTP"}
              </button>
            </div>
            {errors.otp && (
              <p className="mt-1 text-sm text-red-600">{errors.otp}</p>
            )}
          </div>
        )}

        {errors.submit && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{errors.submit}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-md bg-primary py-2 text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading
            ? "Đang xử lý..."
            : !isOtpSent
            ? "Gửi mã OTP"
            : "Hoàn tất đăng ký"}
        </button>

        <div className="text-center text-sm">
          <button
            type="button"
            onClick={() => openAuthPopup("login")}
            className="text-dark hover:text-primary transition duration-300"
          >
            Đã có tài khoản? Đăng nhập
          </button>
        </div>
      </form>
    );
  };

  const renderForm = () => {
    switch (mode) {
      case "login":
        return (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className={`mt-1 block w-full rounded-md shadow-sm py-2.5 px-3 focus:ring-green-500 focus:border-green-500 ${
                  errors.phone ? "border-red-500" : "border-gray-300"
                }`}
                required
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full rounded-md shadow-sm py-2.5 px-3 focus:ring-green-500 focus:border-green-500 ${
                    errors.password ? "border-red-500" : "border-gray-300"
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {errors.submit && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-md bg-primary py-2 text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
            >
              {isLoading ? "Đang xử lý..." : "Đăng nhập"}
            </button>

            {/* THAY THẾ BUTTON GOOGLE CŨ BẰNG PHẦN NÀY */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Hoặc</span>
              </div>
            </div>

            <div className="w-full">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap={false}
                theme="outline"
                size="large"
                width="100%"
                text="signin_with"
                locale="vi"
              />
            </div>

            <div className="flex justify-between text-sm">
              <button
                type="button"
                onClick={() => openAuthPopup("forgot-password")}
                className="text-dark hover:text-primary transition duration-300"
              >
                Quên mật khẩu?
              </button>
              <button
                type="button"
                onClick={() => openAuthPopup("register")}
                className="text-dark hover:text-primary transition duration-300"
              >
                Đăng ký
              </button>
            </div>
          </form>
        );

      case "register":
        return renderRegisterForm();

      case "forgot-password":
        return (
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isOtpSent ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full rounded-md shadow-sm py-2.5 px-3 focus:ring-green-500 focus:border-green-500 ${
                      errors.email ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Nhập email đã đăng ký"
                    required
                    autoFocus
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                <p className="text-sm text-gray-600">
                  Chúng tôi sẽ gửi mã OTP đến email của bạn để đặt lại mật khẩu.
                </p>
              </>
            ) : (
              <>
                <div className="mb-2 p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-700 flex items-center">
                    <Mail size={16} className="mr-2" />
                    Mã OTP đã được gửi đến email {resetEmail}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Mã OTP <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="otp"
                      value={formData.otp}
                      onChange={handleInputChange}
                      maxLength={6}
                      className={`mt-1 flex-1 block w-full rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 ${
                        errors.otp ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Nhập mã 6 số"
                      required
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={!canResendOtp || isLoading}
                      className={`mt-1 px-4 py-2 text-sm font-medium rounded-md border transition-colors ${
                        canResendOtp && !isLoading
                          ? "border-green-500 text-green-600 hover:bg-green-50"
                          : "border-gray-300 text-gray-400 cursor-not-allowed bg-gray-50"
                      }`}
                    >
                      {otpTimer > 0 ? `Gửi lại (${otpTimer}s)` : "Gửi lại OTP"}
                    </button>
                  </div>
                  {errors.otp && (
                    <p className="mt-1 text-sm text-red-600">{errors.otp}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Mật khẩu mới <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`mt-1 block w-full rounded-md shadow-sm py-2.5 px-3 focus:ring-green-500 focus:border-green-500 pr-10 ${
                        errors.newPassword
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {errors.newPassword && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.newPassword}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Mật khẩu phải có ít nhất 6 ký tự, bao gồm chữ hoa, chữ
                    thường và số
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Xác nhận mật khẩu mới{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className={`mt-1 block w-full rounded-md shadow-sm py-2.5 px-3 focus:ring-green-500 focus:border-green-500 pr-10 ${
                        errors.confirmPassword
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={20} />
                      ) : (
                        <Eye size={20} />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </>
            )}

            {errors.submit && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-md bg-primary py-2 text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading
                ? "Đang xử lý..."
                : !isOtpSent
                ? "Gửi mã OTP"
                : "Đặt lại mật khẩu"}
            </button>

            <div className="text-center text-sm">
              <button
                type="button"
                onClick={() => openAuthPopup("login")}
                className="text-dark hover:text-primary transition duration-300"
              >
                Quay lại đăng nhập
              </button>
            </div>
          </form>
        );

      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-lg shadow-xl p-6 z-50 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {mode === "login"
                  ? "Đăng nhập"
                  : mode === "register"
                  ? "Đăng ký"
                  : mode === "forgot-password"
                  ? "Quên mật khẩu"
                  : mode === "verify-otp"
                  ? "Xác thực OTP"
                  : "Đặt lại mật khẩu"}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <X size={24} />
              </button>
            </div>
            {renderForm()}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
