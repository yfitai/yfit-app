import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Mail, Lock, User } from "lucide-react";
import { useState, FormEvent, ChangeEvent } from "react";
import { useLocation } from "wouter";

export default function SignUp() {
  const [, navigate] = useLocation();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSignUp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate sign up process
    setTimeout(() => {
      setIsLoading(false);
      // In a real app, this would authenticate and redirect to the app
      alert("Sign up functionality to be implemented with backend");
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Navigation */}
      <nav className="w-full z-50 border-b border-primary/10 bg-white/50 backdrop-blur">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663099417101/YPVUcoNPoLMtiepj.png" alt="YFIT Logo" className="h-10 w-auto" />
          </div>
          <a href="/" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            Back to Home
          </a>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">Create Your Account</h1>
            <p className="text-muted-foreground">Join thousands of users transforming their fitness</p>
          </div>

          <Card className="glass-card border-primary/20">
            <CardHeader>
              <CardTitle>Sign Up</CardTitle>
              <CardDescription>Create a new YFIT account to get started</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Your full name"
                      value={formData.name}
                      onChange={handleChange}
                      className="pl-10 border-primary/20 focus:border-primary"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      className="pl-10 border-primary/20 focus:border-primary"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      className="pl-10 border-primary/20 focus:border-primary"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="pl-10 border-primary/20 focus:border-primary"
                      required
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating account..." : "Create Account"}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t border-primary/10">
                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <button 
                    onClick={() => navigate('/signin')}
                    className="text-primary font-medium hover:underline cursor-pointer"
                  >
                    Sign in
                  </button>
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-primary/10">
                <p className="text-center text-xs text-muted-foreground">
                  By signing up, you agree to our{" "}
                  <button 
                    onClick={() => navigate('/terms')}
                    className="text-primary hover:underline cursor-pointer"
                  >
                    Terms of Service
                  </button>
                  {" "}and{" "}
                  <button 
                    onClick={() => navigate('/privacy')}
                    className="text-primary hover:underline cursor-pointer"
                  >
                    Privacy Policy
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 p-4 rounded-lg bg-accent/10 border border-accent/20">
            <p className="text-sm text-muted-foreground text-center">
              <strong>Get 1 Month FREE</strong><br />
              Sign up today and enjoy a full month of Pro features at no cost!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
