import { useForm } from "react-hook-form";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, User, Lock } from "lucide-react";
import { Link } from "wouter";
import { useUser } from "@/hooks/use-store";
import { googleAuth, loginUser } from "@/api";
import { useToast } from "@/hooks/use-toast";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { BACKEND_URL } from "@/lib/constants";
import axios from "axios";
import { useRedirectStore } from "@/hooks/use-store";

interface LoginForm {
  username: string;
  password: string;
}

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { userId, role, setUser } = useUser();
  const { toast } = useToast();
  const { redirectUrl } = useRedirectStore();

  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
    setError,
  } = useForm<LoginForm>({
    defaultValues: {
      username: "",
      password: "",
    },
  });

  console.log("login page");
  console.log(userId, role);

  // Redirect if already logged in
  if (userId && role) {
    setLocation("/");
    return null;
  }

  const onSubmit = async (data: LoginForm) => {
    try {
      const res = await loginUser(data.username, data.password);
      console.log(res);
      console.log("setting user");
      setUser({
        userId: res.userId,
        role: res.role,
        card_Verified: res.card_verified,
      });
      localStorage.setItem("sessionId", res.sessionId);
      toast({
        title: "Welcome back!",
        description: "You have been successfully logged in.",
      });
      console.log(redirectUrl);
      if (redirectUrl) setLocation(redirectUrl);
      else setLocation("/");
    } catch (error: any) {
      console.error("Login error:", error);
      setError("root", {
        message:
          error?.message || "Failed to login. Please check your credentials.",
      });
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error?.message || "Invalid credentials. Please try again.",
      });
    }
  };

  async function handleGoogleLogin(credentialResponse: any) {
    console.log(credentialResponse);
    const decoded = jwtDecode(credentialResponse.credential);
    console.log(decoded);
    try {
      const res = await googleAuth(credentialResponse);

      setUser({
        userId: res.userId,
        role: res.role,
        card_Verified: res.card_verified,
      });

      if (res.sessionId) {
        localStorage.setItem("sessionId", res.sessionId);
      }

      toast({
        title: "Welcome back!",
        description: "Successfully signed in with Google.",
      });
      setLocation("/");
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      toast({
        variant: "destructive",
        title: "Google Sign-in Failed",
        description:
          error?.response?.data?.error ||
          "Failed to sign in with Google. Please try again.",
      });
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader className="text-center pb-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
          <CardTitle className="text-3xl font-bold">Welcome Back</CardTitle>
          <p className="text-blue-100 mt-2">Sign in to your account</p>
        </CardHeader>

        <CardContent className="p-8 space-y-6">
          {/* Google Sign-in Section */}
          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-4 text-gray-500 font-medium">
                  Quick Sign In
                </span>
              </div>
            </div>

            <GoogleLogin
              onSuccess={handleGoogleLogin}
              onError={() => {
                toast({
                  variant: "destructive",
                  title: "Google Sign-in Failed",
                  description:
                    "Something went wrong with Google sign-in. Please try again.",
                });
              }}
            />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-4 text-gray-500 font-medium">
                  Or sign in with credentials
                </span>
              </div>
            </div>
          </div>

          {/* Manual Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-700 font-medium">
                Username
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="username"
                  {...register("username", {
                    required: "Username is required",
                  })}
                  type="text"
                  placeholder="Enter your username"
                  className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              {errors.username && (
                <p className="text-sm text-red-600 font-medium">
                  {errors.username.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  {...register("password", {
                    required: "Password is required",
                  })}
                  type="password"
                  placeholder="Enter your password"
                  className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              {errors.password && (
                <p className="text-sm text-red-600 font-medium">
                  {errors.password.message}
                </p>
              )}
            </div>

            {errors.root && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600 text-center font-medium">
                  {errors.root.message}
                </p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 text-base"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          {/* Forgot Password Link
          <div className="text-center">
            <Link href="/forgot-password" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              Forgot your password?
            </Link>
          </div> */}
        </CardContent>

        <CardFooter className="bg-gray-50 rounded-b-lg border-t border-gray-100">
          <p className="text-gray-600 text-center w-full">
            Don't have an account?{" "}
            <Link
              href="/register"
              className="text-blue-600 hover:text-blue-700 font-medium underline"
            >
              Sign up here
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
