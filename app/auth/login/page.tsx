"use client";

import {
  Box,
  Button,
  Field,
  Heading,
  Input,
  Stack,
  Text,
  Tabs,
  Icon,
} from "@chakra-ui/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LuGraduationCap, LuUserCog } from "react-icons/lu";
import { toaster } from "@/components/ui/toaster";
import { useAuth } from "@/contexts/AuthContext";

type UserRole = "student" | "teacher";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [activeRole, setActiveRole] = useState<UserRole>("student");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    username?: string;
    password?: string;
  }>({});

  const validate = () => {
    const newErrors: { username?: string; password?: string } = {};

    if (!username.trim()) {
      newErrors.username = "Username is required";
    } else if (username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toaster.create({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        type: "error",
        duration: 3000,
      });
      return;
    }

    setLoading(true);

    try {
      const result = await login(username, password, activeRole);

      if (result.success) {
        toaster.create({
          title: "Success",
          description: "You have been logged in successfully",
          type: "success",
          duration: 3000,
        });
        // Navigation is handled by the login function in AuthContext
      } else {
        toaster.create({
          title: "Login Failed",
          description: result.error || "Invalid username or password",
          type: "error",
          duration: 3000,
        });
      }
    } catch (error) {
      toaster.create({
        title: "Login Failed",
        description: "An unexpected error occurred. Please try again.",
        type: "error",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg="gray.50"
      _dark={{ bg: "gray.900" }}
      p={4}
      position="relative"
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
          <Stack gap={2} textAlign="center">
            <Heading size="xl">Welcome Back</Heading>
            <Text color="gray.600" _dark={{ color: "gray.400" }}>
              Sign in to your account
            </Text>
          </Stack>

          <Tabs.Root
            value={activeRole}
            onValueChange={(e) => {
              setActiveRole(e.value as UserRole);
              setErrors({});
            }}
            variant="enclosed"
            fitted
          >
            <Tabs.List>
              <Tabs.Trigger value="student">
                <Icon as={LuGraduationCap} mr={2} />
                Student
              </Tabs.Trigger>
              <Tabs.Trigger value="teacher">
                <Icon as={LuUserCog} mr={2} />
                Teacher
              </Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="student" pt={4}>
              <Text
                fontSize="sm"
                color="gray.500"
                _dark={{ color: "gray.400" }}
                mb={4}
              >
                Sign in as a student to access courses, practice, and track your
                progress.
              </Text>
            </Tabs.Content>
            <Tabs.Content value="teacher" pt={4}>
              <Text
                fontSize="sm"
                color="gray.500"
                _dark={{ color: "gray.400" }}
                mb={4}
              >
                Sign in as a teacher to manage courses, groups, and student
                progress.
              </Text>
            </Tabs.Content>
          </Tabs.Root>

          <form onSubmit={handleSubmit}>
            <Stack gap={4}>
              <Field.Root invalid={!!errors.username}>
                <Field.Label>Username</Field.Label>
                <Input
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (errors.username)
                      setErrors((prev) => ({ ...prev, username: undefined }));
                  }}
                />
                {errors.username && (
                  <Field.ErrorText>{errors.username}</Field.ErrorText>
                )}
              </Field.Root>

              <Field.Root invalid={!!errors.password}>
                <Field.Label>Password</Field.Label>
                <Input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password)
                      setErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                />
                {errors.password && (
                  <Field.ErrorText>{errors.password}</Field.ErrorText>
                )}
              </Field.Root>

              <Box textAlign="right" mt={-1}>
                <Button
                  variant="plain"
                  size="sm"
                  color="blue.500"
                  fontWeight="normal"
                  onClick={() => router.push("/auth/forgot-password")}
                  p={0}
                  h="auto"
                >
                  Forgot Password?
                </Button>
              </Box>

              <Button
                type="submit"
                colorPalette="blue"
                size="lg"
                w="full"
                loading={loading}
                mt={2}
              >
                Sign In
              </Button>
            </Stack>
          </form>
        </Stack>
      </Box>
    </Box>
  );
}
