import { Link, useParams } from "react-router-dom";
import { PageContainer } from "@/components/ui/page-container";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StudentPixPaymentBox } from "@/components/student/StudentPixPaymentBox";
import { getPixKey } from "@/lib/pixConfig";
import { useStudentFinancialRecords } from "@/hooks/useStudentPortal";
import { formatCurrency, formatDate } from "@/lib/utils/formatters";
import { ArrowLeft, Loader2, FileText, Calendar, Wallet } from "lucide-react";

export default function StudentCheckout() {
  const { recordId } = useParams<{ recordId: string }>();
  const { data: records = [], isLoading, error } = useStudentFinancialRecords();
  const pixKey = getPixKey();

  const record = recordId ? records.find((r) => r.id === recordId) : null;
  const isPaid = record?.status === "pago";
  const notFound = !isLoading && !error && recordId && !record;

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
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/student/financial" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Financeiro
          </Link>
        </Button>

        <div>
          <h1 className="text-xl font-semibold">Checkout</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Realize o pagamento via PIX abaixo
          </p>
        </div>

        {/* Resumo da cobrança */}
        <Card className="p-4 border-l-4 border-l-primary">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatCurrency(Number(record.amount))}</p>
              <p className="text-xs text-muted-foreground">Valor a pagar</p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            {record.description && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <FileText className="h-4 w-4 shrink-0" />
                <span>{record.description}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4 shrink-0" />
              <span>Vencimento: {formatDate(record.due_date)}</span>
            </div>
          </div>
        </Card>

        {/* PIX */}
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Pagar com PIX
          </h2>
          {pixKey ? (
            <StudentPixPaymentBox pixKey={pixKey} />
          ) : (
            <Card className="p-4 bg-muted/30">
              <p className="text-sm text-muted-foreground text-center">
                Entre em contato com seu professor para obter a chave PIX e realizar o pagamento. Após pagar, envie o comprovante para que ele confirme na plataforma.
              </p>
            </Card>
          )}
        </div>

        <Button variant="outline" className="w-full" asChild>
          <Link to="/student/financial">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Financeiro
          </Link>
        </Button>
      </div>
    </PageContainer>
  );
}
