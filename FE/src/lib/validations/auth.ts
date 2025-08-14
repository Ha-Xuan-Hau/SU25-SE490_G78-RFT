import { z } from "zod";

export const loginSchema = z.object({
  phone: z.string().email("Email không hợp lệ").min(1, "Email là bắt buộc"),
  password: z
    .string()
    .min(6, "Mật khẩu phải có ít nhất 6 ký tự.")
    .max(50, "Mật khẩu không được vượt quá 50 ký tự."),
});

export const registerSchema = z
  .object({
    email: z.string().email("Email không hợp lệ").min(1, "Email là bắt buộc"),
    phone: z
      .string()
      .min(1, "Số điện thoại là bắt buộc")
      .regex(/^[0-9]+$/, "Số điện thoại chỉ được chứa số")
      .min(10, "Số điện thoại phải có ít nhất 10 số")
      .max(11, "Số điện thoại không được vượt quá 11 số"),
    password: z
      .string()
      .min(6, "Mật khẩu phải có ít nhất 6 ký tự.")
      .max(50, "Mật khẩu không được vượt quá 50 ký tự.")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,50}$/,
        "Mật khẩu phải có ít nhất một chữ hoa, một chữ thường và một số."
      ),
    confirmPassword: z.string(),
    // address: z
    //   .string()
    //   .min(1, "Địa chỉ là bắt buộc")
    //   .min(10, "Địa chỉ phải có ít nhất 10 ký tự"),
    otp: z
      .string()
      .min(1, "Mã OTP là bắt buộc")
      .length(6, "Mã OTP phải có đúng 6 ký tự")
      .regex(/^\d+$/, "Mã OTP chỉ được chứa số"),
    referralCode: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp.",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email("Email không hợp lệ").min(1, "Email là bắt buộc"),
});

export const verifyOTPSchema = z.object({
  otp: z
    .string()
    .min(6, "Mã OTP phải có 6 ký tự.")
    .max(6, "Mã OTP phải có 6 ký tự.")
    .regex(/^[0-9]+$/, "Mã OTP chỉ được chứa ký tự số."),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(6, "Mật khẩu phải có ít nhất 6 ký tự.")
      .max(50, "Mật khẩu không được vượt quá 50 ký tự.")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,50}$/,
        "Mật khẩu phải có ít nhất một chữ hoa, một chữ thường và một số."
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp.",
    path: ["confirmPassword"],
  });

export const sendOtpSchema = z.object({
  email: z.string().email("Email không hợp lệ").min(1, "Email là bắt buộc"),
});

export const registerStep1Schema = z
  .object({
    email: z.string().email("Email không hợp lệ").min(1, "Email là bắt buộc"),
    phone: z
      .string()
      .min(1, "Số điện thoại là bắt buộc")
      .regex(/^[0-9]+$/, "Số điện thoại chỉ được chứa số")
      .min(10, "Số điện thoại phải có ít nhất 10 số")
      .max(11, "Số điện thoại không được vượt quá 11 số"),
    password: z
      .string()
      .min(6, "Mật khẩu phải có ít nhất 6 ký tự.")
      .max(50, "Mật khẩu không được vượt quá 50 ký tự.")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,50}$/,
        "Mật khẩu phải có ít nhất một chữ hoa, một chữ thường và một số."
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp.",
    path: ["confirmPassword"],
  });

export const registerStep2Schema = z.object({
  otp: z
    .string()
    .min(1, "Mã OTP là bắt buộc")
    .length(6, "Mã OTP phải có đúng 6 ký tự")
    .regex(/^\d+$/, "Mã OTP chỉ được chứa số"),
});

export const resetPasswordWithOtpSchema = z
  .object({
    email: z.string().email("Email không hợp lệ"),
    otp: z
      .string()
      .length(6, "Mã OTP phải có đúng 6 ký tự")
      .regex(/^\d+$/, "Mã OTP chỉ được chứa số"),
    newPassword: z
      .string()
      .min(6, "Mật khẩu phải có ít nhất 6 ký tự.")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,50}$/,
        "Mật khẩu phải có ít nhất một chữ hoa, một chữ thường và một số."
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp.",
    path: ["confirmPassword"],
  });
