import { useState, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { PageContainer } from "@/components/ui/page-container";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useStudentFinancialRecords,
  useCheckoutPaymentStatus,
} from "@/hooks/useStudentPortal";
import { useCreateAbacatePayment } from "@/hooks/useFinancialRecords";
import { formatCurrency, formatDate } from "@/lib/utils/formatters";
import {
  ArrowLeft,
  CircleNotch as Loader2,
  FileText,
  Calendar,
  Wallet,
  QrCode,
  Copy,
  Check,
  CheckCircle as CheckCircle2,
} from "@phosphor-icons/react";
import { typography } from "@/lib/design-tokens/typography";
import { stack, gap } from "@/lib/design-tokens/spacing";
import { iconSize } from "@/lib/design-tokens/icon-sizes";
import { financial as financialContent } from "@/content";

function formatCpf(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function isPixValid(
  pixCode: string | null | undefined,
  expiresAt: string | null | undefined
): boolean {
  if (!pixCode) return false;
  if (!expiresAt) return false; // AbacatePay sempre define expiresAt; ausência = inválido
  return new Date(expiresAt) > new Date();
}

export default function StudentCheckout() {
  const { recordId } = useParams<{ recordId: string }>();
  const { data: records = [], isLoading, error } = useStudentFinancialRecords();
  const createAbacatePayment = useCreateAbacatePayment();

  const [cpf, setCpf] = useState("");
  const [cpfError, setCpfError] = useState("");
  // Only stores PIX generated in this session; record.pix_code used as fallback
  const [generatedBrCode, setGeneratedBrCode] = useState<string | null>(null);
  const [generatedExpiresAt, setGeneratedExpiresAt] = useState<string | null>(
    null
  );
  const [copied, setCopied] = useState(false);
  const [paid, setPaid] = useState(false);
  const [forceShowForm, setForceShowForm] = useState(false);

  const record = recordId ? records.find((r) => r.id === recordId) : null;
  const isPaid = record?.status === "pago" || paid;
  const isAbacatePay = record?.payment_provider === "abacate_pay";
  const hasValidPix = isPixValid(record?.pix_code, record?.pix_expires_at);

  // Derive what to display: prefer locally generated, fall back to stored record
  // forceShowForm suppresses the fallback so the CPF form is shown after "regenerate"
  const brCode = forceShowForm
    ? generatedBrCode
    : (generatedBrCode ?? (hasValidPix ? (record?.pix_code ?? null) : null));
  const expiresAt = forceShowForm
    ? generatedExpiresAt
    : (generatedExpiresAt ??
      (hasValidPix ? (record?.pix_expires_at ?? null) : null));

  // Realtime: detect payment confirmed by webhook (via hook)
  useCheckoutPaymentStatus(isPaid ? undefined : recordId, () => setPaid(true));

  const handleGenerate = () => {
    const digits = cpf.replace(/\D/g, "");
    if (digits.length !== 11) {
      setCpfError(financialContent.pixPaymentDialog.cpfError);
      return;
    }
    setCpfError("");
    createAbacatePayment.mutate(
      { financialRecordId: record.id, cpf: digits },
      {
        onSuccess: (data) => {
          setGeneratedBrCode(data.brCode);
          setGeneratedExpiresAt(data.expiresAt);
          setForceShowForm(false);
        },
      }
    );
  };

  const handleCopy = useCallback(async () => {
    if (!brCode) return;
    await navigator.clipboard.writeText(brCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [brCode]);

  const notFound = !isLoading && !error && recordId && !record;
  const content = financialContent.pixPaymentDialog;
  const co = financialContent.checkout;

  // --- Loading ---
  if (isLoading) {
    return (
      <PageContainer constrained maxWidth="md">
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">{co.loading}</p>
        </div>
      </PageContainer>
    );
  }

  // --- Not found / error ---
  if (error || notFound || !record) {
    return (
      <PageContainer constrained maxWidth="md">
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">
            {notFound ? co.notFound : co.loadError}
          </p>
          <Button asChild variant="default" className="mt-4">
            <Link to="/student/financial">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {co.backButton}
            </Link>
          </Button>
        </Card>
      </PageContainer>
    );
  }

  // --- Already paid ---
  if (isPaid) {
    return (
      <PageContainer constrained maxWidth="md">
        <Card className="p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-14 w-14 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="h-7 w-7 text-success" />
            </div>
          </div>
          <p className="font-semibold text-lg">{content.paidTitle}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {content.paidDescription}
          </p>
          <Button asChild variant="default" className="mt-6">
            <Link to="/student/financial">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {co.backButton}
            </Link>
          </Button>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer constrained maxWidth="md">
      <div className={stack("RELAXED")}>
        {/* Back */}
        <Button variant="ghost" size="sm" asChild>
          <Link to="/student/financial" className={gap("TIGHT")}>
            <ArrowLeft className={iconSize("SM")} />
            Voltar ao Financeiro
          </Link>
        </Button>

        {/* Title */}
        <div>
          <h1 className={typography("H1")}>{co.pageTitle}</h1>
          <p className={`${typography("SMALL")} mt-1`}>{co.pageSubtitle}</p>
        </div>

        {/* Billing summary */}
        <Card className="p-4 border-l-4 border-l-primary">
          <div className={`flex items-center ${gap("DEFAULT")} mb-3`}>
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Wallet className={iconSize("MD")} />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {formatCurrency(Number(record.amount))}
              </p>
              <p className={typography("TABLE_HEADER")}>{co.amountLabel}</p>
            </div>
          </div>
          <div className={`${stack("TIGHT")} ${typography("BODY")}`}>
            {record.description && (
              <div
                className={`flex items-center ${gap("TIGHT")} text-muted-foreground`}
              >
                <FileText className={`${iconSize("SM")} shrink-0`} />
                <span>{record.description}</span>
              </div>
            )}
            <div
              className={`flex items-center ${gap("TIGHT")} text-muted-foreground`}
            >
              <Calendar className={`${iconSize("SM")} shrink-0`} />
              <span>Vencimento: {formatDate(record.due_date)}</span>
            </div>
          </div>
        </Card>

        {/* ── Payment section ─────────────────────────────── */}
        {!isAbacatePay ? (
          <Card className="p-6 text-center">
            <p className="text-sm text-muted-foreground">{co.manualPayment}</p>
          </Card>
        ) : (
          <div className={stack("TIGHT")}>
            <h2
              className={`${typography("TABLE_HEADER")} flex items-center ${gap("TIGHT")}`}
            >
              <QrCode className={iconSize("SM")} />
              {content.title}
            </h2>

            {/* QR Code already generated and valid */}
            {brCode ? (
              <Card className="p-6">
                <div className={stack("DEFAULT")}>
                  <div className="flex justify-center p-4 bg-white rounded-lg border">
                    <QRCodeSVG value={brCode} size={200} />
                  </div>

                  {expiresAt && (
                    <p className="text-xs text-center text-muted-foreground">
                      {content.expiresAt(formatDate(expiresAt))}
                    </p>
                  )}

                  <div className={stack("TIGHT")}>
                    <Label>{content.pixCopyLabel}</Label>
                    <div className="flex gap-2">
                      <Input
                        value={brCode}
                        readOnly
                        className="font-mono text-xs"
                      />
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={handleCopy}
                        title={content.copyButton}
                      >
                        {copied ? (
                          <Check className="h-4 w-4 text-success" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <p className="text-xs text-center text-muted-foreground">
                    {content.waitingPayment}
                  </p>

                  {/* Allow regeneration if expired or needs new code */}
                  {isAbacatePay && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-muted-foreground"
                      onClick={() => {
                        setGeneratedBrCode(null);
                        setGeneratedExpiresAt(null);
                        setCpf("");
                        setForceShowForm(true);
                      }}
                    >
                      {content.regenerate}
                    </Button>
                  )}
                </div>
              </Card>
            ) : (
              /* CPF form — generate PIX */
              <Card className="p-6">
                <div className={stack("DEFAULT")}>
                  <p className="text-sm text-muted-foreground">
                    {content.cpfDescription}
                  </p>

                  <div className={stack("TIGHT")}>
                    <Label htmlFor="cpf">{content.cpfLabel}</Label>
                    <Input
                      id="cpf"
                      placeholder={content.cpfPlaceholder}
                      value={cpf}
                      onChange={(e) => {
                        setCpf(formatCpf(e.target.value));
                        setCpfError("");
                      }}
                      maxLength={14}
                      disabled={createAbacatePayment.isPending}
                    />
                    {cpfError && (
                      <p className="text-sm text-destructive">{cpfError}</p>
                    )}
                  </div>

                  <Button
                    className="w-full"
                    onClick={handleGenerate}
                    disabled={
                      createAbacatePayment.isPending ||
                      cpf.replace(/\D/g, "").length < 11
                    }
                  >
                    {createAbacatePayment.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        {content.generating}
                      </>
                    ) : (
                      <>
                        <QrCode className="h-4 w-4 mr-2" />
                        {content.generateButton}
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Back button */}
        <Button variant="outline" className="w-full" asChild>
          <Link to="/student/financial">
            <ArrowLeft className={`${iconSize("SM")} mr-2`} />
            Voltar ao Financeiro
          </Link>
        </Button>
      </div>
    </PageContainer>
  );
}
