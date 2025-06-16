import { z } from "zod";

export const loginSchema = z.object({
  phone: z
    .string()
    .min(10, "Số điện thoại phải có ít nhất 10 số.")
    .max(11, "Số điện thoại không được vượt quá 11 số.")
    .regex(/^[0-9]+$/, "Số điện thoại chỉ được chứa ký tự số."),
  password: z
    .string()
    .min(6, "Mật khẩu phải có ít nhất 6 ký tự.")
    .max(50, "Mật khẩu không được vượt quá 50 ký tự."),
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, "Họ tên phải có ít nhất 2 ký tự.")
      .max(50, "Họ tên không được vượt quá 50 ký tự."),
    phone: z
      .string()
      .min(10, "Số điện thoại phải có ít nhất 10 số.")
      .max(11, "Số điện thoại không được vượt quá 11 số.")
      .regex(/^[0-9]+$/, "Số điện thoại chỉ được chứa ký tự số."),
    password: z
      .string()
      .min(6, "Mật khẩu phải có ít nhất 6 ký tự.")
      .max(50, "Mật khẩu không được vượt quá 50 ký tự.")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,50}$/,
        "Mật khẩu phải có ít nhất một chữ hoa, một chữ thường và một số."
      ),
    confirmPassword: z.string(),
    referralCode: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp.",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  phone: z
    .string()
    .min(10, "Số điện thoại phải có ít nhất 10 số.")
    .max(11, "Số điện thoại không được vượt quá 11 số.")
    .regex(/^[0-9]+$/, "Số điện thoại chỉ được chứa ký tự số."),
  email: z.string().email("Email không hợp lệ.").min(5).max(50),
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
