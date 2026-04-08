from .models import (
    Account,
    Budget,
    CardPurchase,
    Category,
    CreditCard,
    CreditCardInvoice,
    Goal,
    Investment,
    Recurrence,
    Transaction,
)


def get_finance_overview_payload():
    return {
        "module": "finance",
        "endpoints": {
            "accounts": "/api/finance/accounts/",
            "categories": "/api/finance/categories/",
            "transactions": "/api/finance/transactions/",
            "credit_cards": "/api/finance/credit-cards/",
            "card_purchases": "/api/finance/card-purchases/",
            "credit_card_invoices": "/api/finance/credit-card-invoices/",
            "investments": "/api/finance/investimentos/",
            "goals": "/api/finance/metas/",
            "budgets": "/api/finance/orcamentos/",
            "recurrences": "/api/finance/recorrencias/",
            "recurrences_generate": "/api/finance/recorrencias/gerar/",
            "cashflow": "/api/finance/fluxo-caixa/",
        },
    }


def get_accounts_queryset(user):
    return Account.objects.select_related("owner").filter(owner=user)


def get_categories_queryset(user):
    return Category.objects.select_related("owner").filter(owner=user)


def get_transactions_queryset(user):
    return Transaction.objects.select_related("owner", "account", "credit_card", "category").filter(
        owner=user
    )


def get_credit_cards_queryset(user):
    return CreditCard.objects.select_related("owner").filter(owner=user)


def get_card_purchases_queryset(user):
    return CardPurchase.objects.select_related("owner", "credit_card", "category").prefetch_related(
        "installments"
    ).filter(owner=user)


def get_credit_card_invoices_queryset(user):
    return CreditCardInvoice.objects.select_related("owner", "credit_card").prefetch_related(
        "items", "payments"
    ).filter(owner=user)


def get_investments_queryset(user):
    return Investment.objects.select_related("owner").filter(owner=user)


def get_goals_queryset(user):
    return Goal.objects.select_related("owner").filter(owner=user)


def get_budgets_queryset(user):
    return Budget.objects.select_related("owner", "category").filter(owner=user)


def get_recurrences_queryset(user):
    return Recurrence.objects.select_related("owner", "account", "credit_card", "category").filter(owner=user)
