"use client";

import {
  Box,
  Button,
  Field,
  Heading,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useState } from "react";
import { toaster } from "@/components/ui/toaster";
import { ColorModeButton } from "@/components/ui/color-mode";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
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
      // TODO: Implement actual login logic
      console.log("Login attempt:", { username, password });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toaster.create({
        title: "Success",
        description: "You have been logged in successfully",
        type: "success",
        duration: 3000,
      });
    } catch {
      toaster.create({
        title: "Login Failed",
        description: "Invalid username or password",
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
      <Box position="absolute" top={4} right={4}>
        <ColorModeButton />
      </Box>
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
