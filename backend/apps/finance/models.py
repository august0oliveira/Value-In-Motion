from datetime import date

from django.conf import settings
from django.db import models
from django.core.validators import MaxValueValidator, MinValueValidator


class Account(models.Model):
    name = models.CharField(max_length=120)
    account_type = models.CharField(max_length=40, default="checking")
    initial_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="accounts",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def balance(self):
        from django.db.models import Sum
        receitas = self.transactions.filter(
            transaction_type="income"
        ).aggregate(t=Sum("amount"))["t"] or 0
        despesas = self.transactions.filter(
            transaction_type="expense"
        ).aggregate(t=Sum("amount"))["t"] or 0
        return self.initial_balance + receitas - despesas

    def __str__(self):
        return self.name

class Category(models.Model):
    TRANSACTION_TYPE_CHOICES = (
        ("income", "Income"),
        ("expense", "Expense"),
    )

    name = models.CharField(max_length=100)
    transaction_type = models.CharField(
        max_length=10,
        choices=TRANSACTION_TYPE_CHOICES,
        default="expense",
    )
    icon = models.CharField(max_length=10, blank=True, default="📦")
    color = models.CharField(max_length=7, blank=True, default="#6366f1")
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="categories",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("owner", "name", "transaction_type")

    def __str__(self):
        return self.name


class Transaction(models.Model):
    TRANSACTION_TYPE_CHOICES = (
        ("income", "Income"),
        ("expense", "Expense"),
    )

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="transactions",
    )
    account = models.ForeignKey(
        Account,
        on_delete=models.CASCADE,
        related_name="transactions",
        null=True,
        blank=True,
    )
    credit_card = models.ForeignKey(
        "CreditCard",
        on_delete=models.SET_NULL,
        related_name="transactions",
        null=True,
        blank=True,
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name="transactions",
    )
    transaction_type = models.CharField(
        max_length=10,
        choices=TRANSACTION_TYPE_CHOICES,
    )
    description = models.CharField(max_length=255, blank=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    occurred_on = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-occurred_on", "-id")

    def __str__(self):
        return f"{self.transaction_type} - {self.amount}"


class CreditCard(models.Model):
    name = models.CharField(max_length=120)
    brand = models.CharField(max_length=40, blank=True, default="")
    limit_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    closing_day = models.PositiveSmallIntegerField(
        default=25,
        validators=[MinValueValidator(1), MaxValueValidator(31)],
    )
    due_day = models.PositiveSmallIntegerField(
        default=5,
        validators=[MinValueValidator(1), MaxValueValidator(31)],
    )
    is_active = models.BooleanField(default=True)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="credit_cards",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("owner", "name")

    def __str__(self):
        return self.name


class CardPurchase(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="card_purchases",
    )
    credit_card = models.ForeignKey(
        CreditCard,
        on_delete=models.CASCADE,
        related_name="purchases",
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name="card_purchases",
    )
    description = models.CharField(max_length=255)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    installments_count = models.PositiveSmallIntegerField(
        default=1,
        validators=[MinValueValidator(1), MaxValueValidator(48)],
    )
    purchase_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-purchase_date", "-id")

    def __str__(self):
        return f"{self.description} ({self.installments_count}x)"


class CardInstallment(models.Model):
    STATUS_CHOICES = (
        ("open", "Open"),
        ("paid", "Paid"),
        ("canceled", "Canceled"),
    )

    purchase = models.ForeignKey(
        CardPurchase,
        on_delete=models.CASCADE,
        related_name="installments",
    )
    installment_number = models.PositiveSmallIntegerField()
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    due_date = models.DateField()
    status = models.CharField(max_length=12, choices=STATUS_CHOICES, default="open")
    transaction = models.OneToOneField(
        Transaction,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="installment",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("purchase", "installment_number")
        ordering = ("due_date", "installment_number")

    def __str__(self):
        return f"{self.purchase.description} {self.installment_number}/{self.purchase.installments_count}"


class CreditCardInvoice(models.Model):
    STATUS_CHOICES = (
        ("open", "Open"),
        ("closed", "Closed"),
        ("paid", "Paid"),
    )

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="credit_card_invoices",
    )
    credit_card = models.ForeignKey(
        CreditCard,
        on_delete=models.CASCADE,
        related_name="invoices",
    )
    period_start = models.DateField()
    period_end = models.DateField()
    closing_date = models.DateField()
    due_date = models.DateField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="open")
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    paid_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-period_end", "-id")
        unique_together = ("credit_card", "period_start", "period_end")

    @property
    def is_overdue(self):
        return self.status != "paid" and date.today() > self.due_date

    def __str__(self):
        return f"{self.credit_card.name} {self.period_start} - {self.period_end}"


class CreditCardInvoiceItem(models.Model):
    invoice = models.ForeignKey(
        CreditCardInvoice,
        on_delete=models.CASCADE,
        related_name="items",
    )
    transaction = models.ForeignKey(
        Transaction,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="invoice_items",
    )
    installment = models.ForeignKey(
        CardInstallment,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="invoice_items",
    )
    description = models.CharField(max_length=255, blank=True, default="")
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    occurred_on = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("occurred_on", "id")
        unique_together = ("invoice", "transaction")

    def __str__(self):
        return f"{self.invoice.credit_card.name} {self.amount}"


class CreditCardInvoicePayment(models.Model):
    invoice = models.ForeignKey(
        CreditCardInvoice,
        on_delete=models.CASCADE,
        related_name="payments",
    )
    account = models.ForeignKey(
        Account,
        on_delete=models.PROTECT,
        related_name="invoice_payments",
    )
    transaction = models.OneToOneField(
        Transaction,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="invoice_payment",
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    paid_on = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-paid_on", "-id")

    def __str__(self):
        return f"{self.invoice.credit_card.name} {self.amount}"


class Investment(models.Model):
    INVESTMENT_TYPE_CHOICES = (
        ("renda_fixa", "Renda fixa"),
        ("renda_variavel", "Renda variavel"),
        ("fii", "FII"),
        ("cripto", "Cripto"),
        ("outros", "Outros"),
    )

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="investments",
    )
    name = models.CharField(max_length=120)
    investment_type = models.CharField(max_length=30, choices=INVESTMENT_TYPE_CHOICES, default="renda_fixa")
    institution = models.CharField(max_length=120, blank=True, default="")
    invested_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    current_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    contribution_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-contribution_date", "-id")

    def __str__(self):
        return self.name


class Goal(models.Model):
    PRIORITY_CHOICES = (
        ("low", "Baixa"),
        ("medium", "Media"),
        ("high", "Alta"),
    )

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="goals",
    )
    title = models.CharField(max_length=150)
    target_amount = models.DecimalField(max_digits=12, decimal_places=2)
    current_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    due_date = models.DateField(null=True, blank=True)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default="medium")
    active = models.BooleanField(default=True)
    notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("due_date", "-id")

    def __str__(self):
        return self.title


class Budget(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="budgets",
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name="budgets",
    )
    month_ref = models.CharField(max_length=7)
    limit_amount = models.DecimalField(max_digits=12, decimal_places=2)
    alert_percent = models.PositiveSmallIntegerField(
        default=80,
        validators=[MinValueValidator(1), MaxValueValidator(100)],
    )
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-month_ref", "-id")
        unique_together = ("owner", "category", "month_ref")

    def __str__(self):
        return f"{self.category.name} {self.month_ref}"


class Recurrence(models.Model):
    TRANSACTION_TYPE_CHOICES = (
        ("income", "Receita"),
        ("expense", "Despesa"),
    )
    SOURCE_CHOICES = (
        ("account", "Conta"),
        ("credit_card", "Cartao"),
    )
    FREQUENCY_CHOICES = (
        ("weekly", "Semanal"),
        ("monthly", "Mensal"),
        ("yearly", "Anual"),
    )

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="recurrences",
    )
    description = models.CharField(max_length=255)
    transaction_type = models.CharField(max_length=10, choices=TRANSACTION_TYPE_CHOICES, default="expense")
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES, default="account")
    account = models.ForeignKey(
        Account,
        on_delete=models.CASCADE,
        related_name="recurrences",
        null=True,
        blank=True,
    )
    credit_card = models.ForeignKey(
        CreditCard,
        on_delete=models.CASCADE,
        related_name="recurrences",
        null=True,
        blank=True,
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name="recurrences",
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    frequency = models.CharField(max_length=10, choices=FREQUENCY_CHOICES, default="monthly")
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-start_date", "-id")

    def __str__(self):
        return self.description


class RecurrenceOccurrence(models.Model):
    recurrence = models.ForeignKey(
        Recurrence,
        on_delete=models.CASCADE,
        related_name="occurrences",
    )
    occurred_on = models.DateField()
    transaction = models.OneToOneField(
        Transaction,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="recurrence_occurrence",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-occurred_on", "-id")
        unique_together = ("recurrence", "occurred_on")

    def __str__(self):
        return f"{self.recurrence.description} {self.occurred_on}"
