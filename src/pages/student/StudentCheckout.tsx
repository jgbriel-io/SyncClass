import { Link, useParams } from "react-router-dom";
import { PageContainer } from "@/components/ui/page-container";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StudentPixPaymentBox } from "@/components/student/StudentPixPaymentBox";
import { useStudentFinancialRecords } from "@/hooks/useStudentPortal";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentUserProfile } from "@/hooks/useUsers";
import { useTeacherPixKeyByStudent } from "@/hooks/useStudents";
import { formatCurrency, formatDate } from "@/lib/utils/formatters";
import { ArrowLeft, Loader2, FileText, Calendar, Wallet, Upload, CheckCircle2 } from "lucide-react";
import { typography } from "@/lib/design-tokens/typography";
import { stack, gap } from "@/lib/design-tokens/spacing";
import { iconSize } from "@/lib/design-tokens/icon-sizes";
import { useSubmitPaymentProof } from "@/hooks/usePaymentProof";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { common } from "@/content";

export default function StudentCheckout() {
  const { recordId } = useParams<{ recordId: string }>();
  const { user } = useAuth();
  const { data: profile } = useCurrentUserProfile(user?.id);
  const { data: records = [], isLoading, error } = useStudentFinancialRecords();
  const { data: teacherPixKey, isLoading: isLoadingPixKey } = useTeacherPixKeyByStudent(profile?.student_id);
  const submitProof = useSubmitPaymentProof();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const record = recordId ? records.find((r) => r.id === recordId) : null;
  const isPaid = record?.status === "pago";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hasProof = !!(record as any)?.payment_proof_url;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const proofStatus = (record as any)?.payment_proof_status;
  const notFound = !isLoading && !error && recordId && !record;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    const validTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      toast.error(common.errors.invalidFileType);
      return;
    }

    // Validar tamanho (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(common.errors.fileTooLarge);
      return;
    }

    setSelectedFile(file);
  };

  const handleSubmitProof = () => {
    if (!selectedFile || !recordId) return;

    submitProof.mutate(
      { financialRecordId: recordId, file: selectedFile },
      {
        onSuccess: () => {
          setSelectedFile(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        },
      }
    );
  };

  if (isLoading) {
    return (
      <PageContainer constrained maxWidth="md">
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Carregando...</p>
        </div>
      </PageContainer>
    );
  }

  if (error || notFound || !record) {
    return (
      <PageContainer constrained maxWidth="md">
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">
            {notFound ? "Cobrança não encontrada." : "Erro ao carregar a cobrança."}
          </p>
          <Button asChild variant="default" className="mt-4">
            <Link to="/student/financial">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Financeiro
            </Link>
          </Button>
        </Card>
      </PageContainer>
    );
  }

  if (isPaid) {
    return (
      <PageContainer constrained maxWidth="md">
        <Card className="p-6 text-center">
          <p className="font-medium">Esta cobrança já foi paga.</p>
          <Button asChild variant="default" className="mt-4">
            <Link to="/student/financial">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Financeiro
            </Link>
          </Button>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer constrained maxWidth="md">
      <div className={stack('RELAXED')}>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/student/financial" className={gap('TIGHT')}>
            <ArrowLeft className={iconSize('SM')} />
            Voltar ao Financeiro
          </Link>
        </Button>

        <div>
          <h1 className={typography('H1')}>Checkout</h1>
          <p className={`${typography('SMALL')} mt-1`}>
            Realize o pagamento via PIX abaixo
          </p>
        </div>

        {/* Resumo da cobrança */}
        <Card className="p-4 border-l-4 border-l-primary">
          <div className={`flex items-center ${gap('DEFAULT')} mb-3`}>
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Wallet className={iconSize('MD')} />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatCurrency(Number(record.amount))}</p>
              <p className={typography('TABLE_HEADER')}>Valor a pagar</p>
            </div>
          </div>
          <div className={`${stack('TIGHT')} ${typography('BODY')}`}>
            {record.description && (
              <div className={`flex items-center ${gap('TIGHT')} text-muted-foreground`}>
                <FileText className={`${iconSize('SM')} shrink-0`} />
                <span>{record.description}</span>
              </div>
            )}
            <div className={`flex items-center ${gap('TIGHT')} text-muted-foreground`}>
              <Calendar className={`${iconSize('SM')} shrink-0`} />
              <span>Vencimento: {formatDate(record.due_date)}</span>
            </div>
          </div>
        </Card>

        {/* PIX */}
        <div className={stack('TIGHT')}>
          <h2 className={typography('TABLE_HEADER')}>
            Pagar com PIX
          </h2>
          {isLoadingPixKey ? (
            <Card className="p-4 bg-muted/30">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <p className={`${typography('SMALL')}`}>
                  Carregando chave PIX...
                </p>
              </div>
            </Card>
          ) : teacherPixKey ? (
            <StudentPixPaymentBox pixKey={teacherPixKey} />
          ) : (
            <Card className="p-4 bg-muted/30">
              <p className={`${typography('SMALL')} text-center`}>
                Entre em contato com seu professor para obter a chave PIX e realizar o pagamento. Após pagar, envie o comprovante para que ele confirme na plataforma.
              </p>
            </Card>
          )}
        </div>

        {/* Enviar Comprovante */}
        {!isPaid && (
          <div className={stack('TIGHT')}>
            <h2 className={typography('TABLE_HEADER')}>
              Enviar Comprovante
            </h2>
            
            {hasProof && proofStatus !== "rejected" ? (
              <Card className="p-4 bg-success/5 border-success/30">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Comprovante enviado!</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {proofStatus === "pending" && "Aguardando confirmação do professor"}
                      {proofStatus === "approved" && "Comprovante aprovado"}
                    </p>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="p-4">
                {proofStatus === "rejected" && (
                  <div className="mb-3 p-2 rounded-lg bg-destructive/10 border border-destructive/30">
                    <p className="text-sm font-medium text-destructive">Comprovante rejeitado</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Envie um novo comprovante válido
                    </p>
                  </div>
                )}
                
                <p className="text-sm text-muted-foreground mb-3">
                  {proofStatus === "rejected" 
                    ? "Selecione um novo comprovante para enviar."
                    : "Após realizar o pagamento, envie o comprovante para que seu professor possa confirmar."}
                </p>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                
                {selectedFile ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm flex-1 truncate">{selectedFile.name}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedFile(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = "";
                          }
                        }}
                      >
                        Remover
                      </Button>
                    </div>
                    <Button
                      className="w-full"
                      onClick={handleSubmitProof}
                      disabled={submitProof.isPending}
                    >
                      {submitProof.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Enviar Comprovante
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Selecionar Arquivo
                  </Button>
                )}
                
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Formatos aceitos: JPEG, PNG, WebP ou PDF (máx. 5MB)
                </p>
              </Card>
            )}
          </div>
        )}

        <Button variant="outline" className="w-full" asChild>
          <Link to="/student/financial">
            <ArrowLeft className={`${iconSize('SM')} mr-2`} />
            Voltar ao Financeiro
          </Link>
        </Button>
      </div>
    </PageContainer>
  );
}
