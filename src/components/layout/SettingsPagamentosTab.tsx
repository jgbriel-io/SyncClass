import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Copy, Check, Eye, EyeOff, ExternalLink } from "lucide-react";
import {
  useTeacherAbacatePayConfig,
  useUpdateTeacherAbacatePayConfig,
} from "@/hooks/useTeachers";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { layout } from "@/content";

const SUPABASE_PROJECT_URL = supabase.supabaseUrl;

const s = layout.settings.payments;

interface SettingsPagamentosTabProps {
  teacherId: string;
}

export function SettingsPagamentosTab({
  teacherId,
}: SettingsPagamentosTabProps) {
  const { data: config, isLoading } = useTeacherAbacatePayConfig(teacherId);
  const updateConfig = useUpdateTeacherAbacatePayConfig();

  const [editing, setEditing] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  const isConfigured = !!config?.abacate_pay_api_key;
  const webhookSecret = config?.abacate_pay_webhook_secret;
  const webhookBaseUrl = webhookSecret
    ? `${SUPABASE_PROJECT_URL}/functions/v1/abacate-webhook`
    : null;

  // Inicia input vazio ao editar — nunca pré-preenche com o ciphertext do banco
  useEffect(() => {
    if (editing) setApiKey("");
  }, [editing]);

  const handleSave = () => {
    updateConfig.mutate(
      {
        teacherId,
        apiKey: apiKey.trim() || null,
        existingWebhookSecret: webhookSecret,
      },
      { onSuccess: () => setEditing(false) }
    );
  };

  const handleCancel = () => {
    setEditing(false);
    setApiKey("");
    setShowKey(false);
  };

  const handleRemove = () => {
    updateConfig.mutate(
      {
        teacherId,
        apiKey: null,
        existingWebhookSecret: null,
      },
      { onSuccess: () => setEditing(false) }
    );
  };

  const handleCopyUrl = async () => {
    if (!webhookBaseUrl) return;
    await navigator.clipboard.writeText(webhookBaseUrl);
    setCopiedUrl(true);
    toast.success(s.toasts.copySuccess);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleCopySecret = async () => {
    if (!webhookSecret) return;
    await navigator.clipboard.writeText(webhookSecret);
    setCopiedSecret(true);
    toast.success(s.toasts.copySuccess);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-5 py-4">
      {/* Status badge */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{s.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{s.subtitle}</p>
        </div>
        <Badge variant={isConfigured ? "default" : "secondary"}>
          {isConfigured ? s.configured : s.notConfigured}
        </Badge>
      </div>

      {/* API Key */}
      <div className="space-y-2">
        <Label htmlFor="abacate-api-key">{s.apiKeyLabel}</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              id="abacate-api-key"
              type={showKey ? "text" : "password"}
              value={
                editing ? apiKey : isConfigured ? "••••••••••••••••••••" : ""
              }
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={editing ? s.apiKeyPlaceholder : undefined}
              readOnly={!editing}
              className={editing ? "pr-10" : "bg-muted/50 pr-10"}
            />
            {(editing || isConfigured) && (
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowKey((v) => !v)}
                tabIndex={-1}
              >
                {showKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            )}
          </div>

          {!editing ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditing(true)}
            >
              {s.editButton}
            </Button>
          ) : (
            <>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={updateConfig.isPending || !apiKey.trim()}
              >
                {updateConfig.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  s.saveButton
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCancel}
                disabled={updateConfig.isPending}
              >
                {s.cancelButton}
              </Button>
            </>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {s.apiKeyHint}{" "}
          <a
            href="https://app.abacatepay.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 underline underline-offset-2"
          >
            app.abacatepay.com
            <ExternalLink className="h-3 w-3" />
          </a>
        </p>
      </div>

      {/* Webhook */}
      <div className="space-y-3 border-t pt-4">
        <Label>{s.webhookTitle}</Label>
        {webhookBaseUrl && webhookSecret ? (
          <>
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground font-medium">
                {s.webhookUrlLabel}
              </p>
              <div className="flex gap-2">
                <Input
                  value={webhookBaseUrl}
                  readOnly
                  className="bg-muted/50 font-mono text-xs"
                />
                <Button size="icon" variant="outline" onClick={handleCopyUrl}>
                  {copiedUrl ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground font-medium">
                {s.webhookSecretLabel}
              </p>
              <div className="flex gap-2">
                <Input
                  value={webhookSecret}
                  readOnly
                  className="bg-muted/50 font-mono text-xs"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={handleCopySecret}
                >
                  {copiedSecret ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            {s.webhookNotConfigured}
          </p>
        )}
        <p className="text-xs text-muted-foreground">{s.webhookHint}</p>
      </div>

      {/* Remove integration */}
      {isConfigured && !editing && (
        <div className="border-t pt-4">
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={handleRemove}
            disabled={updateConfig.isPending}
          >
            {s.removeButton}
          </Button>
        </div>
      )}
    </div>
  );
}
