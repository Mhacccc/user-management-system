import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-6xl w-full grid gap-12 md:grid-cols-2 items-center">
        <div className="space-y-6">
          <h1 className="text-4xl md:text-5xl font-extrabold">
            Manage users with ease
          </h1>
          <p className="text-muted-foreground max-w-lg">
            A simple user management system built with Next.js, Tailwind,
            and shadcn/ui components. Fast, accessible, and theme-aware.
          </p>

          <div className="flex gap-3">
            <Link href="/signup">
              <Button className="inline-flex items-center">Get Started</Button>
            </Link>
            <Link href="/login">
              <Button className="inline-flex items-center" variant="outline">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Quick sign in</CardTitle>
              <CardDescription>Jump into your dashboard</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Already have an account? Quickly sign in to view and manage
                users.
              </p>
              <div className="flex gap-2">
                <Link href="/login">
                  <Button className="w-full">Sign In</Button>
                </Link>
                <Link href="/signup">
                  <Button variant="outline" className="w-full">
                    Create
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
