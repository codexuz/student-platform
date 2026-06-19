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
  Grid,
  Flex,
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
    <Grid minH="100vh" templateColumns={{ base: "1fr", lg: "1fr 1fr" }}>
      {/* Left Panel - Image Background */}
      <Flex
        display={{ base: "none", lg: "flex" }}
        position="relative"
        bgImage="url('/images/login-bg.png')"
        bgSize="cover"
        backgroundPosition="center"
        align="center"
        justify="center"
        p={12}
      >
        <Box
          position="absolute"
          inset={0}
          bg="blackAlpha.500"
          backdropFilter="blur(2px)"
        />
        
        <Stack
          position="relative"
          zIndex={1}
          color="white"
          maxW="xl"
          gap={6}
          bg="whiteAlpha.100"
          backdropFilter="blur(24px)"
          p={10}
          borderRadius="3xl"
          border="1px solid"
          borderColor="whiteAlpha.300"
          boxShadow="0 20px 40px rgba(0, 0, 0, 0.4)"
        >
          <Heading size="4xl" fontWeight="bold" letterSpacing="tight" lineHeight="1.1">
            Unlock Your<br /> IELTS Potential
          </Heading>
          <Text fontSize="xl" color="whiteAlpha.900" lineHeight="tall">
            Join the ultimate platform to practice, analyze your progress, and achieve your target band score with AI-driven insights.
          </Text>
        </Stack>
      </Flex>

      {/* Right Panel - Login Form */}
      <Flex
        align="center"
        justify="center"
        bg="white"
        _dark={{ bg: "gray.900" }}
        p={{ base: 6, md: 12 }}
        position="relative"
        overflow="hidden"
      >
        {/* Subtle mesh background for the login side */}
        <Box
          position="absolute"
          top="-20%"
          right="-10%"
          w="60%"
          h="60%"
          bg="blue.50"
          _dark={{ bg: "blue.500", opacity: 0.15 }}
          filter="blur(120px)"
          opacity={0.6}
          borderRadius="full"
          zIndex={0}
          pointerEvents="none"
        />
        <Box
          position="absolute"
          bottom="-10%"
          left="-10%"
          w="50%"
          h="50%"
          bg="green.50"
          _dark={{ bg: "green.400", opacity: 0.15 }}
          filter="blur(100px)"
          opacity={0.5}
          borderRadius="full"
          zIndex={0}
          pointerEvents="none"
        />

        <Box
          w="full"
          maxW="md"
          position="relative"
          zIndex={1}
          bg="rgba(255, 255, 255, 0.85)"
          backdropFilter="blur(20px)"
          rounded="2xl"
          shadow="2xl"
          border="1px solid"
          borderColor="rgba(0, 0, 0, 0.05)"
          _dark={{ bg: "rgba(30, 30, 35, 0.6)", borderColor: "whiteAlpha.200" }}
          p={{ base: 8, md: 10 }}
        >
          <Stack gap={8}>
            <Stack gap={2} textAlign="center">
              <Heading size="3xl" fontWeight="bold" letterSpacing="tight" _dark={{ color: "white" }}>Welcome</Heading>
              <Text color="gray.500" _dark={{ color: "gray.400" }}>
                Sign in to continue to your account
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
                  color="blue.600"
                  _dark={{ color: "blue.400" }}
                  fontWeight="medium"
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
                borderRadius="xl"
                fontWeight="semibold"
                shadow="md"
                _hover={{ shadow: "lg", transform: "translateY(-1px)" }}
                transition="all 0.2s"
              >
                Sign In
              </Button>
            </Stack>
          </form>
        </Stack>
      </Box>
    </Flex>
    </Grid>
  );
}
