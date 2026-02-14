import { Link, useParams } from "react-router-dom";
import { PageContainer } from "@/components/ui/page-container";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StudentPixPaymentBox } from "@/components/student/StudentPixPaymentBox";
import { getPixKey } from "@/lib/pixConfig";
import { useStudentFinancialRecords } from "@/hooks/useStudentPortal";
import { formatCurrency, formatDate } from "@/lib/utils/formatters";
import { ArrowLeft, Loader2, FileText, Calendar, Wallet } from "lucide-react";
import { typography } from "@/lib/design-tokens/typography";
import { stack, gap } from "@/lib/design-tokens/spacing";
import { iconSize } from "@/lib/design-tokens/icon-sizes";

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
          {pixKey ? (
            <StudentPixPaymentBox pixKey={pixKey} />
          ) : (
            <Card className="p-4 bg-muted/30">
              <p className={`${typography('SMALL')} text-center`}>
                Entre em contato com seu professor para obter a chave PIX e realizar o pagamento. Após pagar, envie o comprovante para que ele confirme na plataforma.
              </p>
            </Card>
          )}
        </div>

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
