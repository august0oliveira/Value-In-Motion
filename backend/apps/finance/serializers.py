from datetime import date
from decimal import Decimal, ROUND_DOWN
import calendar

from django.db import transaction
from rest_framework import serializers

from .models import (
    Account,
    Budget,
    CardInstallment,
    CardPurchase,
    Category,
    CreditCardInvoice,
    CreditCardInvoiceItem,
    CreditCardInvoicePayment,
    CreditCard,
    Goal,
    Investment,
    Recurrence,
    Transaction,
)


def _add_months(dt, months):
    month = dt.month - 1 + months
    year = dt.year + month // 12
    month = month % 12 + 1
    day = min(dt.day, calendar.monthrange(year, month)[1])
    return date(year, month, day)


def _due_date_for_installment(purchase_date, closing_day, due_day, installment_index):
    # Compra ate o fechamento entra na fatura do mes corrente, vencendo no mes seguinte.
    # Compra apos o fechamento entra na proxima fatura, vencendo no mes subsequente.
    base_offset = 1 if purchase_date.day <= closing_day else 2
    first_due_anchor = _add_months(date(purchase_date.year, purchase_date.month, 1), base_offset)
    target_month = _add_months(first_due_anchor, installment_index)
    target_day = min(due_day, calendar.monthrange(target_month.year, target_month.month)[1])
    return date(target_month.year, target_month.month, target_day)


class AccountSerializer(serializers.ModelSerializer):
    balance = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = Account
        fields = (
            "id",
            "name",
            "account_type",
            "initial_balance",
            "balance",
            "owner",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "owner", "balance", "created_at", "updated_at")


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = (
            "id",
            "name",
            "transaction_type",
            "icon",
            "color",
            "owner",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "owner", "created_at", "updated_at")


class TransactionSerializer(serializers.ModelSerializer):
    installment_id = serializers.SerializerMethodField()

    def get_installment_id(self, obj):
        installment = getattr(obj, "installment", None)
        return installment.id if installment else None

    def validate(self, attrs):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        instance = getattr(self, "instance", None)

        account = attrs.get("account", getattr(instance, "account", None))
        credit_card = attrs.get("credit_card", getattr(instance, "credit_card", None))
        category = attrs.get("category", getattr(instance, "category", None))
        transaction_type = attrs.get("transaction_type", getattr(instance, "transaction_type", None))

        if user and account and account.owner_id != user.id:
            raise serializers.ValidationError(
                {"account": "Conta nao pertence ao usuario autenticado."}
            )

        if user and credit_card and credit_card.owner_id != user.id:
            raise serializers.ValidationError(
                {"credit_card": "Cartao nao pertence ao usuario autenticado."}
            )

        if user and category and category.owner_id != user.id:
            raise serializers.ValidationError(
                {"category": "Categoria nao pertence ao usuario autenticado."}
            )

        if category and transaction_type and category.transaction_type != transaction_type:
            raise serializers.ValidationError(
                {"transaction_type": "Tipo da transacao deve ser igual ao da categoria."}
            )

        if transaction_type == "income":
            if not account:
                raise serializers.ValidationError(
                    {"account": "Receita deve ser vinculada a uma conta."}
                )
            if credit_card:
                raise serializers.ValidationError(
                    {"credit_card": "Receita nao pode ser vinculada a cartao de credito."}
                )

        if transaction_type == "expense":
            if bool(account) == bool(credit_card):
                raise serializers.ValidationError(
                    {
                        "account": "Despesa deve ter conta ou cartao (apenas um).",
                        "credit_card": "Despesa deve ter conta ou cartao (apenas um).",
                    }
                )

        return attrs

    class Meta:
        model = Transaction
        fields = (
            "id",
            "owner",
            "account",
            "credit_card",
            "category",
            "transaction_type",
            "description",
            "amount",
            "occurred_on",
            "installment_id",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "owner", "created_at", "updated_at")


class CreditCardSerializer(serializers.ModelSerializer):
    class Meta:
        model = CreditCard
        fields = (
            "id",
            "name",
            "brand",
            "limit_amount",
            "closing_day",
            "due_day",
            "is_active",
            "owner",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "owner", "created_at", "updated_at")


class CardInstallmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = CardInstallment
        fields = (
            "id",
            "installment_number",
            "amount",
            "due_date",
            "status",
            "transaction",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields


class CardPurchaseSerializer(serializers.ModelSerializer):
    installments = CardInstallmentSerializer(many=True, read_only=True)

    class Meta:
        model = CardPurchase
        fields = (
            "id",
            "owner",
            "credit_card",
            "category",
            "description",
            "total_amount",
            "installments_count",
            "purchase_date",
            "installments",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "owner", "installments", "created_at", "updated_at")

    def validate(self, attrs):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        credit_card = attrs.get("credit_card")
        category = attrs.get("category")
        installments_count = attrs.get("installments_count")
        total_amount = attrs.get("total_amount")

        if user and credit_card and credit_card.owner_id != user.id:
            raise serializers.ValidationError(
                {"credit_card": "Cartao nao pertence ao usuario autenticado."}
            )

        if user and category and category.owner_id != user.id:
            raise serializers.ValidationError(
                {"category": "Categoria nao pertence ao usuario autenticado."}
            )

        if category and category.transaction_type != "expense":
            raise serializers.ValidationError(
                {"category": "Compra no cartao deve usar categoria de despesa."}
            )

        if installments_count and installments_count < 1:
            raise serializers.ValidationError(
                {"installments_count": "Quantidade de parcelas deve ser maior que zero."}
            )

        if total_amount and total_amount <= 0:
            raise serializers.ValidationError(
                {"total_amount": "Valor total deve ser maior que zero."}
            )

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        owner = validated_data.get("owner")
        purchase = CardPurchase.objects.create(**validated_data)
        self._rebuild_installments(owner, purchase)
        return purchase

    @transaction.atomic
    def update(self, instance, validated_data):
        owner = instance.owner
        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.save()

        old_transactions = [item.transaction for item in instance.installments.all() if item.transaction]
        instance.installments.all().delete()
        for trx in old_transactions:
            trx.delete()

        self._rebuild_installments(owner, instance)
        return instance

    def _rebuild_installments(self, owner, purchase):
        total = Decimal(purchase.total_amount)
        count = int(purchase.installments_count)
        base = (total / count).quantize(Decimal("0.01"), rounding=ROUND_DOWN)
        remainder = (total - (base * count)).quantize(Decimal("0.01"))

        for index in range(count):
            extra = Decimal("0.00")
            if remainder > 0:
                extra = min(remainder, Decimal("0.01"))
                remainder -= extra
            amount = base + extra
            due = _due_date_for_installment(
                purchase.purchase_date,
                int(purchase.credit_card.closing_day),
                int(purchase.credit_card.due_day),
                index,
            )
            number = index + 1
            description = (
                f"{purchase.description} ({number}/{count})"
                if count > 1
                else purchase.description
            )
            trx = Transaction.objects.create(
                owner=owner,
                account=None,
                credit_card=purchase.credit_card,
                category=purchase.category,
                transaction_type="expense",
                description=description,
                amount=amount,
                occurred_on=due,
            )
            CardInstallment.objects.create(
                purchase=purchase,
                installment_number=number,
                amount=amount,
                due_date=due,
                status="open",
                transaction=trx,
            )


class CreditCardInvoiceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = CreditCardInvoiceItem
        fields = (
            "id",
            "description",
            "amount",
            "occurred_on",
            "transaction",
            "installment",
            "created_at",
        )
        read_only_fields = fields


class CreditCardInvoicePaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = CreditCardInvoicePayment
        fields = (
            "id",
            "account",
            "amount",
            "paid_on",
            "transaction",
            "created_at",
        )
        read_only_fields = fields


class CreditCardInvoiceSerializer(serializers.ModelSerializer):
    items = CreditCardInvoiceItemSerializer(many=True, read_only=True)
    payments = CreditCardInvoicePaymentSerializer(many=True, read_only=True)

    class Meta:
        model = CreditCardInvoice
        fields = (
            "id",
            "owner",
            "credit_card",
            "period_start",
            "period_end",
            "closing_date",
            "due_date",
            "status",
            "total_amount",
            "paid_amount",
            "items",
            "payments",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields


class InvestmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Investment
        fields = (
            "id",
            "owner",
            "name",
            "investment_type",
            "institution",
            "invested_amount",
            "current_amount",
            "contribution_date",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "owner", "created_at", "updated_at")


class GoalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Goal
        fields = (
            "id",
            "owner",
            "title",
            "target_amount",
            "current_amount",
            "due_date",
            "priority",
            "active",
            "notes",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "owner", "created_at", "updated_at")


class BudgetSerializer(serializers.ModelSerializer):
    def validate(self, attrs):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        instance = getattr(self, "instance", None)
        category = attrs.get("category", getattr(instance, "category", None))

        if user and category and category.owner_id != user.id:
            raise serializers.ValidationError({"category": "Categoria nao pertence ao usuario autenticado."})

        if category and category.transaction_type != "expense":
            raise serializers.ValidationError({"category": "Orcamento deve usar categoria de despesa."})

        month_ref = attrs.get("month_ref", getattr(instance, "month_ref", ""))
        if month_ref and (len(month_ref) != 7 or month_ref[4] != "-"):
            raise serializers.ValidationError({"month_ref": "Formato esperado AAAA-MM."})

        return attrs

    class Meta:
        model = Budget
        fields = (
            "id",
            "owner",
            "category",
            "month_ref",
            "limit_amount",
            "alert_percent",
            "active",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "owner", "created_at", "updated_at")


class RecurrenceSerializer(serializers.ModelSerializer):
    def validate(self, attrs):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        instance = getattr(self, "instance", None)

        transaction_type = attrs.get("transaction_type", getattr(instance, "transaction_type", "expense"))
        source = attrs.get("source", getattr(instance, "source", "account"))
        account = attrs.get("account", getattr(instance, "account", None))
        credit_card = attrs.get("credit_card", getattr(instance, "credit_card", None))
        category = attrs.get("category", getattr(instance, "category", None))

        if user and account and account.owner_id != user.id:
            raise serializers.ValidationError({"account": "Conta nao pertence ao usuario autenticado."})
        if user and credit_card and credit_card.owner_id != user.id:
            raise serializers.ValidationError({"credit_card": "Cartao nao pertence ao usuario autenticado."})
        if user and category and category.owner_id != user.id:
            raise serializers.ValidationError({"category": "Categoria nao pertence ao usuario autenticado."})

        if category and category.transaction_type != transaction_type:
            raise serializers.ValidationError({"transaction_type": "Tipo deve ser igual ao da categoria."})

        if transaction_type == "income":
            if not account:
                raise serializers.ValidationError({"account": "Receita recorrente deve ter conta."})
            if credit_card:
                raise serializers.ValidationError({"credit_card": "Receita recorrente nao usa cartao."})
            attrs["source"] = "account"

        if transaction_type == "expense":
            if source == "credit_card":
                if not credit_card:
                    raise serializers.ValidationError({"credit_card": "Despesa por cartao deve ter cartao."})
                attrs["account"] = None
            else:
                if not account:
                    raise serializers.ValidationError({"account": "Despesa por conta deve ter conta."})
                attrs["credit_card"] = None

        start_date = attrs.get("start_date", getattr(instance, "start_date", None))
        end_date = attrs.get("end_date", getattr(instance, "end_date", None))
        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError({"end_date": "Data final nao pode ser menor que a inicial."})
        return attrs

    class Meta:
        model = Recurrence
        fields = (
            "id",
            "owner",
            "description",
            "transaction_type",
            "source",
            "account",
            "credit_card",
            "category",
            "amount",
            "frequency",
            "start_date",
            "end_date",
            "active",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "owner", "created_at", "updated_at")
