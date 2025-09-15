import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">Welcome to Your Application</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Your full-stack application is now running successfully on Replit
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>✅ Server Running</CardTitle>
              <CardDescription>Express server is active on port 5000</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Your backend API is ready to handle requests
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>⚡ Vite Dev Server</CardTitle>
              <CardDescription>Fast development with hot reload</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                React frontend with modern tooling
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>🔐 Authentication Ready</CardTitle>
              <CardDescription>Better Auth & RBAC configured</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                User authentication and role-based access control
              </p>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>🚀 Ready to Build</CardTitle>
            <CardDescription>Your project migration is complete</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Start building your features by adding routes to the router in client/src/App.tsx
              and API endpoints in server/routes.ts
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}