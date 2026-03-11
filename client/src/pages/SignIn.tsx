import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Mail, Lock } from "lucide-react";
import { useState } from "react";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate sign in process
    setTimeout(() => {
      setIsLoading(false);
      // In a real app, this would authenticate and redirect to the app
      alert("Sign in functionality to be implemented with backend");
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Navigation */}
      <nav className="w-full z-50 border-b border-primary/10 bg-white/50 backdrop-blur">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/images/yfit-logo.png" alt="YFIT Logo" className="h-10 w-auto" />
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
            <h1 className="text-4xl font-bold text-foreground mb-2">Welcome Back</h1>
            <p className="text-muted-foreground">Sign in to your YFIT account to continue</p>
          </div>

          <Card className="glass-card border-primary/20">
            <CardHeader>
              <CardTitle>Sign In</CardTitle>
              <CardDescription>Enter your credentials to access your account</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
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
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
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
                  {isLoading ? "Signing in..." : "Sign In"}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t border-primary/10">
                <p className="text-center text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <a href="/signup" className="text-primary font-medium hover:underline">
                    Sign up
                  </a>
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-primary/10">
                <p className="text-center text-xs text-muted-foreground">
                  <a href="#" className="hover:text-primary transition-colors">Forgot password?</a>
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 p-4 rounded-lg bg-accent/10 border border-accent/20">
            <p className="text-sm text-muted-foreground text-center">
              <strong>Demo Credentials:</strong><br />
              Email: demo@yfit.com<br />
              Password: demo123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
