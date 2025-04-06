import { useForm } from "react-hook-form";
import { useAuth } from "@/hooks/use-auth";
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
import { Loader2 } from "lucide-react";
import { Link } from "wouter";
import { useUser } from "@/hooks/use-store";
import { loginUser } from "@/api";
import { useToast } from "@/hooks/use-toast";

interface LoginForm {
  username: string;
  password: string;
}

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { userId, role, setUser } = useUser();
  const { toast } = useToast();

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
      });
      toast({
        title: "Success!",
        description: "Login Successful",
      });
      setLocation("/");
    } catch (error: any) {
      console.error("Login error:", error);
      setError("root", {
        message:
          error?.message || "Failed to login. Please check your credentials.",
      });
      toast({
        variant: "destructive",
        title: "Failed!",
        description: "Something went wrong!",
      });
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Admin Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                {...register("username", { required: "Username is required" })}
                type="text"
                placeholder="Enter your username"
              />
              {errors.username && (
                <p className="text-sm text-destructive">
                  {errors.username.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                {...register("password", { required: "Password is required" })}
                type="password"
                placeholder="Enter your password"
              />
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>
            {errors.root && (
              <p className="text-sm text-destructive text-center">
                {errors.root.message}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <p className="text-base text-gray-500">
            Don't have an account.{" "}
            <Link href="/register" className="underline text-gray-600">
              Sign Up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
