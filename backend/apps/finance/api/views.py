import django_filters
from datetime import datetime, date
from decimal import Decimal, InvalidOperation
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, filters, status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from ..selectors import (
    get_accounts_queryset,
    get_budgets_queryset,
    get_card_purchases_queryset,
    get_categories_queryset,
    get_credit_cards_queryset,
    get_credit_card_invoices_queryset,
    get_finance_overview_payload,
    get_goals_queryset,
    get_investments_queryset,
    get_recurrences_queryset,
    get_transactions_queryset,
)
from ..serializers import (
    AccountSerializer,
    BudgetSerializer,
    CardPurchaseSerializer,
    CategorySerializer,
    CreditCardInvoiceSerializer,
    CreditCardSerializer,
    GoalSerializer,
    InvestmentSerializer,
    RecurrenceSerializer,
    TransactionSerializer,
)
from ..services import (
    close_invoice,
    generate_recurrences,
    get_cashflow_projection,
    ensure_open_invoices_for_user,
    get_or_create_open_invoice,
    pay_invoice,
    remove_card_purchase_and_related_transactions,
)
from ..models import Account, CreditCardInvoice


class TransactionFilter(django_filters.FilterSet):
    mes = django_filters.CharFilter(method="filter_mes", label="Mês (AAAA-MM)")
    data_inicio = django_filters.DateFilter(field_name="occurred_on", lookup_expr="gte")
    data_fim = django_filters.DateFilter(field_name="occurred_on", lookup_expr="lte")
    tipo = django_filters.CharFilter(field_name="transaction_type")
    categoria = django_filters.NumberFilter(field_name="category__id")
    conta = django_filters.NumberFilter(field_name="account__id")
    cartao = django_filters.NumberFilter(field_name="credit_card__id")

    def filter_mes(self, queryset, name, value):
        # Espera formato AAAA-MM, ex: 2025-03
        try:
            ano, mes = value.split("-")
            return queryset.filter(
                occurred_on__year=int(ano),
                occurred_on__month=int(mes),
            )
        except (ValueError, AttributeError):
            return queryset

    class Meta:
        model = __import__(
            "apps.finance.models", fromlist=["Transaction"]
        ).Transaction
        fields = ["tipo", "categoria", "conta", "cartao"]


@api_view(["GET"])
def finance_overview(request):
    return Response(get_finance_overview_payload())


class AccountListCreateView(generics.ListCreateAPIView):
    serializer_class = AccountSerializer

    def get_queryset(self):
        return get_accounts_queryset(self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class AccountDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AccountSerializer

    def get_queryset(self):
        return get_accounts_queryset(self.request.user)


class CategoryListCreateView(generics.ListCreateAPIView):
    serializer_class = CategorySerializer

    def get_queryset(self):
        return get_categories_queryset(self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class CategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CategorySerializer

    def get_queryset(self):
        return get_categories_queryset(self.request.user)


class TransactionListCreateView(generics.ListCreateAPIView):
    serializer_class = TransactionSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_class = TransactionFilter
    ordering_fields = ["occurred_on", "amount", "created_at"]
    ordering = ["-occurred_on"]

    def get_queryset(self):
        return get_transactions_queryset(self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class TransactionDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TransactionSerializer

    def get_queryset(self):
        return get_transactions_queryset(self.request.user)


class CreditCardListCreateView(generics.ListCreateAPIView):
    serializer_class = CreditCardSerializer

    def get_queryset(self):
        return get_credit_cards_queryset(self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class CreditCardDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CreditCardSerializer

    def get_queryset(self):
        return get_credit_cards_queryset(self.request.user)


class CardPurchaseListCreateView(generics.ListCreateAPIView):
    serializer_class = CardPurchaseSerializer

    def get_queryset(self):
        return get_card_purchases_queryset(self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class CardPurchaseDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CardPurchaseSerializer

    def get_queryset(self):
        return get_card_purchases_queryset(self.request.user)

    def perform_destroy(self, instance):
        remove_card_purchase_and_related_transactions(instance)


class CreditCardInvoiceListView(generics.ListAPIView):
    serializer_class = CreditCardInvoiceSerializer

    def get_queryset(self):
        ensure_open_invoices_for_user(self.request.user)
        queryset = get_credit_card_invoices_queryset(self.request.user)
        credit_card = self.request.query_params.get("credit_card")
        if credit_card:
            return queryset.filter(credit_card_id=credit_card)
        return queryset


class CreditCardInvoiceDetailView(generics.RetrieveAPIView):
    serializer_class = CreditCardInvoiceSerializer

    def get_queryset(self):
        ensure_open_invoices_for_user(self.request.user)
        return get_credit_card_invoices_queryset(self.request.user)


@api_view(["POST"])
def credit_card_invoice_close(request, pk):
    try:
        invoice = CreditCardInvoice.objects.select_related("credit_card").get(pk=pk, owner=request.user)
    except CreditCardInvoice.DoesNotExist:
        return Response({"detail": "Fatura nao encontrada."}, status=status.HTTP_404_NOT_FOUND)

    invoice = close_invoice(invoice)
    return Response(CreditCardInvoiceSerializer(invoice).data)


@api_view(["POST"])
def credit_card_invoice_pay(request, pk):
    try:
        invoice = CreditCardInvoice.objects.select_related("credit_card").get(pk=pk, owner=request.user)
    except CreditCardInvoice.DoesNotExist:
        return Response({"detail": "Fatura nao encontrada."}, status=status.HTTP_404_NOT_FOUND)

    account_id = request.data.get("account")
    amount_raw = request.data.get("amount")
    paid_on_raw = request.data.get("paid_on")

    if not account_id or not amount_raw:
        return Response(
            {"detail": "Informe conta e valor para pagar a fatura."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        amount = Decimal(str(amount_raw))
    except InvalidOperation:
        return Response({"detail": "Valor invalido."}, status=status.HTTP_400_BAD_REQUEST)

    if amount <= 0:
        return Response({"detail": "Valor deve ser maior que zero."}, status=status.HTTP_400_BAD_REQUEST)

    paid_on = None
    if paid_on_raw:
        try:
            paid_on = datetime.strptime(paid_on_raw, "%Y-%m-%d").date()
        except ValueError:
            return Response({"detail": "Data de pagamento invalida."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        account = Account.objects.get(pk=account_id, owner=request.user)
    except Account.DoesNotExist:
        return Response({"detail": "Conta invalida."}, status=status.HTTP_400_BAD_REQUEST)

    invoice = pay_invoice(invoice, account, amount, paid_on)
    return Response(CreditCardInvoiceSerializer(invoice).data)


@api_view(["POST"])
def generate_recurrences_view(request):
    ate_raw = request.data.get("ate")
    ate = None
    if ate_raw:
        try:
            ate = datetime.strptime(ate_raw, "%Y-%m-%d").date()
        except ValueError:
            return Response({"detail": "Data 'ate' invalida."}, status=status.HTTP_400_BAD_REQUEST)
    count = generate_recurrences(request.user, until_date=ate)
    return Response({"created": count, "ate": (ate or (date.today())).isoformat()})


@api_view(["GET"])
def cashflow_projection_view(request):
    dias_raw = request.query_params.get("dias", "90")
    try:
        dias = int(dias_raw)
    except ValueError:
        return Response({"detail": "Parametro dias invalido."}, status=status.HTTP_400_BAD_REQUEST)

    if dias < 1 or dias > 365:
        return Response({"detail": "Dias deve estar entre 1 e 365."}, status=status.HTTP_400_BAD_REQUEST)

    payload = get_cashflow_projection(request.user, days=dias)
    return Response(payload)


class InvestmentListCreateView(generics.ListCreateAPIView):
    serializer_class = InvestmentSerializer

    def get_queryset(self):
        return get_investments_queryset(self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class InvestmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = InvestmentSerializer

    def get_queryset(self):
        return get_investments_queryset(self.request.user)


class GoalListCreateView(generics.ListCreateAPIView):
    serializer_class = GoalSerializer

    def get_queryset(self):
        return get_goals_queryset(self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class GoalDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = GoalSerializer

    def get_queryset(self):
        return get_goals_queryset(self.request.user)


class BudgetListCreateView(generics.ListCreateAPIView):
    serializer_class = BudgetSerializer

    def get_queryset(self):
        return get_budgets_queryset(self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class BudgetDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = BudgetSerializer

    def get_queryset(self):
        return get_budgets_queryset(self.request.user)


class RecurrenceListCreateView(generics.ListCreateAPIView):
    serializer_class = RecurrenceSerializer

    def get_queryset(self):
        return get_recurrences_queryset(self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class RecurrenceDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = RecurrenceSerializer

    def get_queryset(self):
        return get_recurrences_queryset(self.request.user)
