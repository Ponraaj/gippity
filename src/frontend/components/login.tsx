import { useAuthActions } from "@convex-dev/auth/react";
import { GoogleIcon } from "./ui/GoogleIcon";
import { Button } from "@/frontend/components/ui/button";

export default function Login() {
  const { signIn } = useAuthActions();
  return (
    <div className="flex h-screen items-center justify-center">
      <Button
        className="bg-medium-purple text-almost-white-pink hover:bg-medium-purple/90"
        type="button"
        onClick={() => void signIn("google")}
      >
        <GoogleIcon className="mr-2 h-4 w-4 text-almost-white-pink" /> Sign in with Google
      </Button>
    </div>
  );
}
