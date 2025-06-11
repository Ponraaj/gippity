import { useAuthActions } from "@convex-dev/auth/react";
import { GoogleIcon } from "./ui/GoogleIcon";
import { Button } from "@/frontend/components/ui/button";

export default function Login() {
  const { signIn } = useAuthActions();
  return (
    <div className="flex h-screen items-center justify-center">
      <Button
        className=""
        variant="outline"
        type="button"
        onClick={() => void signIn("google")}
      >
        <GoogleIcon className="mr-2 h-4 w-4" /> Sign in with Google
      </Button>
    </div>
  );
}
