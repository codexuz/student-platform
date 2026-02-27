"use client";

import {
  Box,
  Button,
  Field,
  Heading,
  Input,
  Stack,
  Text,
  HStack,
  PinInput,
} from "@chakra-ui/react";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toaster } from "@/components/ui/toaster";
import { authAPI } from "@/lib/api";
import { ArrowLeft, Phone, ShieldCheck, Lock } from "lucide-react";

type Step = "phone" | "verify" | "reset";

const CODE_EXPIRY = 5 * 60; // 5 minutes in seconds

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [loading, setLoading] = useState(false);

  // Form state
  const [phone, setPhone] = useState("+998 ");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Timer
  const [countdown, setCountdown] = useState(0);

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  // Step 1 — Request code
  const handleRequestCode = useCallback(async () => {
    const rawPhone = phone.replace(/[^\d+]/g, "");
    if (!rawPhone) {
      setErrors({ phone: "Phone number is required" });
      return;
    }
    if (!/^\+?\d{9,15}$/.test(rawPhone)) {
      setErrors({
        phone: "Enter a valid phone number (e.g. +998 (90) 123-45-67)",
      });
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      await authAPI.forgotPassword(rawPhone);
      toaster.create({
        title: "Code Sent",
        description: "A verification code has been sent to your phone",
        type: "success",
        duration: 4000,
      });
      setCountdown(CODE_EXPIRY);
      setStep("verify");
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message || "Failed to send code";
      if (msg.includes("404") || msg.toLowerCase().includes("not found")) {
        setErrors({ phone: "No account found with this phone number" });
      } else {
        toaster.create({
          title: "Error",
          description: msg,
          type: "error",
          duration: 4000,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [phone]);

  // Step 2 — Verify code
  const handleVerifyCode = useCallback(async () => {
    if (code.length !== 6) {
      setErrors({ code: "Enter the 6-digit code" });
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      const rawPhone = phone.replace(/[^\d+]/g, "");
      await authAPI.verifyResetCode(rawPhone, code);
      toaster.create({
        title: "Code Verified",
        description: "Now set your new password",
        type: "success",
        duration: 3000,
      });
      setStep("reset");
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || "Invalid code";
      if (msg.toLowerCase().includes("too many")) {
        setErrors({ code: "Too many attempts. Please request a new code." });
      } else if (
        msg.toLowerCase().includes("expired") ||
        msg.toLowerCase().includes("no active")
      ) {
        setErrors({ code: "Code expired. Please request a new one." });
      } else {
        setErrors({ code: "Invalid verification code" });
      }
    } finally {
      setLoading(false);
    }
  }, [phone, code]);

  // Step 3 — Confirm reset
  const handleResetPassword = useCallback(async () => {
    const errs: Record<string, string> = {};
    if (!newPassword) {
      errs.newPassword = "Password is required";
    } else if (newPassword.length < 6) {
      errs.newPassword = "Password must be at least 6 characters";
    }
    if (newPassword !== confirmPassword) {
      errs.confirmPassword = "Passwords do not match";
    }
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      const rawPhone = phone.replace(/[^\d+]/g, "");
      await authAPI.confirmResetPassword(rawPhone, code, newPassword);
      toaster.create({
        title: "Password Reset",
        description: "Your password has been updated. Please log in.",
        type: "success",
        duration: 5000,
      });
      router.push("/auth/login");
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message || "Failed to reset password";
      toaster.create({
        title: "Error",
        description: msg,
        type: "error",
        duration: 4000,
      });
      // Code may be invalid/expired, go back to step 1
      setStep("phone");
      setCode("");
      setNewPassword("");
      setConfirmPassword("");
    } finally {
      setLoading(false);
    }
  }, [phone, code, newPassword, confirmPassword, router]);

  const handleResend = async () => {
    setCode("");
    setErrors({});
    setLoading(true);
    try {
      await authAPI.forgotPassword(phone);
      setCountdown(CODE_EXPIRY);
      toaster.create({
        title: "Code Resent",
        description: "A new verification code has been sent",
        type: "success",
        duration: 3000,
      });
    } catch {
      toaster.create({
        title: "Error",
        description: "Failed to resend code",
        type: "error",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const stepConfig = {
    phone: {
      icon: Phone,
      title: "Forgot Password",
      subtitle: "Enter your phone number to receive a verification code",
    },
    verify: {
      icon: ShieldCheck,
      title: "Verify Code",
      subtitle: `Enter the 6-digit code sent to ${phone}`,
    },
    reset: {
      icon: Lock,
      title: "New Password",
      subtitle: "Set your new password",
    },
  };

  const current = stepConfig[step];
  const StepIcon = current.icon;

  return (
    <Box
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg="gray.50"
      _dark={{ bg: "gray.900" }}
      p={4}
    >
      <Box
        w="full"
        maxW="md"
        bg="white"
        _dark={{ bg: "gray.800" }}
        rounded="lg"
        shadow="lg"
        p={8}
      >
        <Stack gap={6}>
          {/* Back link */}
          <Button
            variant="ghost"
            size="sm"
            alignSelf="flex-start"
            onClick={() => {
              if (step === "phone") {
                router.push("/auth/login");
              } else if (step === "verify") {
                setStep("phone");
              } else {
                setStep("verify");
              }
            }}
          >
            <ArrowLeft size={16} />
            Back
          </Button>

          {/* Header */}
          <Stack gap={2} textAlign="center" align="center">
            <Box
              w={14}
              h={14}
              bg="blue.50"
              _dark={{ bg: "blue.900" }}
              borderRadius="full"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <StepIcon size={24} color="var(--chakra-colors-blue-500)" />
            </Box>
            <Heading size="xl">{current.title}</Heading>
            <Text color="gray.600" _dark={{ color: "gray.400" }} fontSize="sm">
              {current.subtitle}
            </Text>
          </Stack>

          {/* Step indicator */}
          <HStack justify="center" gap={2}>
            {(["phone", "verify", "reset"] as Step[]).map((s, i) => (
              <Box
                key={s}
                h={1.5}
                flex={1}
                maxW="60px"
                borderRadius="full"
                bg={
                  i <= ["phone", "verify", "reset"].indexOf(step)
                    ? "blue.500"
                    : "gray.200"
                }
                _dark={{
                  bg:
                    i <= ["phone", "verify", "reset"].indexOf(step)
                      ? "blue.400"
                      : "gray.600",
                }}
                transition="background 0.2s"
              />
            ))}
          </HStack>

          {/* Step 1: Phone */}
          {step === "phone" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleRequestCode();
              }}
            >
              <Stack gap={4}>
                <Field.Root invalid={!!errors.phone}>
                  <Field.Label>Phone Number</Field.Label>
                  <Input
                    type="tel"
                    placeholder="+998 (XX) XXX XX-XX"
                    value={phone}
                    onChange={(e) => {
                      let raw = e.target.value.replace(/[^\d+]/g, "");
                      // Auto-prepend +998 if user types plain digits
                      if (!raw.startsWith("+") && raw.startsWith("998")) {
                        raw = "+" + raw;
                      }
                      // Don't let user delete the +998 prefix
                      if (!raw.startsWith("+998")) {
                        raw = "+998";
                      }
                      const digits = raw.slice(4).slice(0, 9); // max 9 digits after +998
                      let formatted = "+998";
                      if (digits.length > 0)
                        formatted += ` (${digits.slice(0, 2)}`;
                      if (digits.length >= 2) formatted += ")";
                      if (digits.length > 2)
                        formatted += ` ${digits.slice(2, 5)}`;
                      if (digits.length > 5)
                        formatted += ` ${digits.slice(5, 7)}`;
                      if (digits.length > 7)
                        formatted += `-${digits.slice(7, 9)}`;
                      if (digits.length === 0) formatted += " ";
                      setPhone(formatted);
                      if (errors.phone) setErrors({});
                    }}
                  />
                  {errors.phone && (
                    <Field.ErrorText>{errors.phone}</Field.ErrorText>
                  )}
                </Field.Root>

                <Button
                  type="submit"
                  colorPalette="blue"
                  size="lg"
                  w="full"
                  loading={loading}
                >
                  Send Verification Code
                </Button>
              </Stack>
            </form>
          )}

          {/* Step 2: Verify Code */}
          {step === "verify" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleVerifyCode();
              }}
            >
              <Stack gap={4} align="center">
                <Field.Root invalid={!!errors.code}>
                  <PinInput.Root
                    value={code.split("").concat(Array(6).fill("")).slice(0, 6)}
                    onValueChange={(details) => {
                      const joined = details.value
                        .map((v: string | undefined) => v ?? "")
                        .join("");
                      setCode(joined);
                      if (errors.code) setErrors({});
                    }}
                    otp
                  >
                    <PinInput.HiddenInput />
                    <PinInput.Control>
                      <PinInput.Input index={0} />
                      <PinInput.Input index={1} />
                      <PinInput.Input index={2} />
                      <PinInput.Input index={3} />
                      <PinInput.Input index={4} />
                      <PinInput.Input index={5} />
                    </PinInput.Control>
                  </PinInput.Root>
                  {errors.code && (
                    <Field.ErrorText>{errors.code}</Field.ErrorText>
                  )}
                </Field.Root>

                <Button
                  type="submit"
                  colorPalette="blue"
                  size="lg"
                  w="full"
                  loading={loading}
                  disabled={code.length !== 6}
                >
                  Verify Code
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResend}
                  disabled={loading || countdown > 0}
                >
                  {countdown > 0
                    ? `Resend in ${formatTime(countdown)}`
                    : "Resend Code"}
                </Button>
              </Stack>
            </form>
          )}

          {/* Step 3: New Password */}
          {step === "reset" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleResetPassword();
              }}
            >
              <Stack gap={4}>
                <Field.Root invalid={!!errors.newPassword}>
                  <Field.Label>New Password</Field.Label>
                  <Input
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (errors.newPassword) {
                        setErrors(
                          Object.fromEntries(
                            Object.entries(errors).filter(
                              ([k]) => k !== "newPassword",
                            ),
                          ),
                        );
                      }
                    }}
                  />
                  {errors.newPassword && (
                    <Field.ErrorText>{errors.newPassword}</Field.ErrorText>
                  )}
                </Field.Root>

                <Field.Root invalid={!!errors.confirmPassword}>
                  <Field.Label>Confirm Password</Field.Label>
                  <Input
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errors.confirmPassword) {
                        setErrors(
                          Object.fromEntries(
                            Object.entries(errors).filter(
                              ([k]) => k !== "confirmPassword",
                            ),
                          ),
                        );
                      }
                    }}
                  />
                  {errors.confirmPassword && (
                    <Field.ErrorText>{errors.confirmPassword}</Field.ErrorText>
                  )}
                </Field.Root>

                <Button
                  type="submit"
                  colorPalette="blue"
                  size="lg"
                  w="full"
                  loading={loading}
                >
                  Reset Password
                </Button>
              </Stack>
            </form>
          )}
        </Stack>
      </Box>
    </Box>
  );
}
