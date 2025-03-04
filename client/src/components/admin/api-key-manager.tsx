import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Eye, EyeOff, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ApiKey {
  name: string;
  key: string;
  description: string;
}

export default function ApiKeyManager() {
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const { data: apiKeys, isLoading } = useQuery<ApiKey[]>({
    queryKey: ["/api/keys"],
  });

  const updateMutation = useMutation({
    mutationFn: async ({ name, key }: { name: string; key: string }) => {
      await apiRequest("PATCH", "/api/keys", { name, key });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "API key updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleUpdateKey = async (name: string, key: string) => {
    await updateMutation.mutateAsync({ name, key });
  };

  const toggleKeyVisibility = (name: string) => {
    setShowKey(prev => ({ ...prev, [name]: !prev[name] }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {apiKeys?.map((apiKey) => (
        <Card key={apiKey.name}>
          <CardHeader>
            <CardTitle className="text-lg">{apiKey.name}</CardTitle>
            <CardDescription>{apiKey.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  type={showKey[apiKey.name] ? "text" : "password"}
                  value={apiKey.key}
                  onChange={(e) => handleUpdateKey(apiKey.name, e.target.value)}
                  placeholder="Enter API key"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => toggleKeyVisibility(apiKey.name)}
              >
                {showKey[apiKey.name] ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
