import { auth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function ProfilePage() {
  const session = await auth();
  const user = session!.user;

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">Profile</h1>
      <Card>
        <CardHeader><CardTitle>Account Details</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div><span className="text-sm text-muted-foreground">Name</span><p className="font-medium">{user.name}</p></div>
          <div><span className="text-sm text-muted-foreground">Email</span><p className="font-medium">{user.email}</p></div>
          <div><span className="text-sm text-muted-foreground">Role</span><p><Badge>{user.role}</Badge></p></div>
        </CardContent>
      </Card>
    </div>
  );
}
