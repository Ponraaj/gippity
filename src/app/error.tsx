"use client";

import { useEffect } from "react";
import { Button } from "@/frontend/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/frontend/components/ui/card";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-[420px]">
        <CardHeader>
          <CardTitle>Something went wrong!</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            An error occurred while loading this page.
          </p>
        </CardContent>
        <CardFooter>
          <Button onClick={() => reset()} variant="default">
            Try again
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
