import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t("fr", "admin.nav.analytics")}
        </h1>
        <p className="text-muted-foreground">
          Bientôt disponible.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Placeholder</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Les analytics seront disponibles dans une prochaine version.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
