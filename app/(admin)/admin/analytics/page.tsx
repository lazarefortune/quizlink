import { Card, CardContent } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default async function AdminAnalyticsPage() {
  return (
    <div className="p-4 sm:p-5 md:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Bientôt disponible.
          </p>
        </div>
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Les analytics seront disponibles dans une prochaine version.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
