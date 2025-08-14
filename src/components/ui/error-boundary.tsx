import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundaryClass extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}

function ErrorFallback({ error }: { error: Error | null }) {
  const { t } = useTranslation();
  
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-lg">
            {t("errors.something_wrong")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            {t("errors.try_reload")}
          </p>
          {error && (
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer mb-2">
                {t("errors.technical_details")}
              </summary>
              <pre className="bg-muted p-2 rounded text-xs overflow-auto">
                {error.message}
              </pre>
            </details>
          )}
          <Button onClick={handleReload} className="w-full" variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            {t("errors.reload_page")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default ErrorBoundaryClass;