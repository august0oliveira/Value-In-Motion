from datetime import date, timedelta
import calendar
from decimal import Decimal

from django.db import models, transaction

from .models import (
    Account,
    Category,
    CreditCard,
    CreditCardInvoice,
    CreditCardInvoiceItem,
    CreditCardInvoicePayment,
    Recurrence,
    RecurrenceOccurrence,
    Transaction,
)


def remove_card_purchase_and_related_transactions(purchase):
    transactions = [item.transaction for item in purchase.installments.all() if item.transaction]
    purchase.delete()
    for trx in transactions:
        trx.delete()


def _clamp_day(year, month, day):
    return min(day, calendar.monthrange(year, month)[1])


def _add_months(dt, months):
    month = dt.month - 1 + months
    year = dt.year + month // 12
    month = month % 12 + 1
    return date(year, month, _clamp_day(year, month, dt.day))


def get_invoice_period(card: CreditCard, reference_date=None):
    ref = reference_date or date.today()
    closing_day = int(card.closing_day)
    due_day = int(card.due_day)

    if ref.day <= closing_day:
        closing_date = date(ref.year, ref.month, _clamp_day(ref.year, ref.month, closing_day))
    else:
        next_month = _add_months(date(ref.year, ref.month, 1), 1)
        closing_date = date(
            next_month.year, next_month.month, _clamp_day(next_month.year, next_month.month, closing_day)
        )

    prev_closing_month = _add_months(date(closing_date.year, closing_date.month, 1), -1)
    prev_closing_date = date(
        prev_closing_month.year,
        prev_closing_month.month,
        _clamp_day(prev_closing_month.year, prev_closing_month.month, closing_day),
    )
    period_start = prev_closing_date + timedelta(days=1)
    period_end = closing_date

    due_month = _add_months(date(closing_date.year, closing_date.month, 1), 1)
    due_date = date(due_month.year, due_month.month, _clamp_day(due_month.year, due_month.month, due_day))

    return {
        "period_start": period_start,
        "period_end": period_end,
        "closing_date": closing_date,
        "due_date": due_date,
    }


def _get_invoice_total(card, period_start, period_end):
    return (
        Transaction.objects.filter(
            credit_card=card,
            transaction_type="expense",
            occurred_on__gte=period_start,
            occurred_on__lte=period_end,
        ).aggregate(total=models.Sum("amount"))["total"]
        or Decimal("0.00")
    )


def get_or_create_open_invoice(card, reference_date=None):
    period = get_invoice_period(card, reference_date)
    invoice, created = CreditCardInvoice.objects.get_or_create(
        owner=card.owner,
        credit_card=card,
        period_start=period["period_start"],
        period_end=period["period_end"],
        defaults={
            "closing_date": period["closing_date"],
            "due_date": period["due_date"],
            "status": "open",
            "total_amount": Decimal("0.00"),
            "paid_amount": Decimal("0.00"),
        },
    )

    if invoice.status == "open":
        total = _get_invoice_total(card, period["period_start"], period["period_end"])
        if invoice.total_amount != total:
            invoice.total_amount = total
            invoice.save(update_fields=["total_amount", "updated_at"])
    return invoice


def ensure_open_invoices_for_user(user):
    cards = CreditCard.objects.filter(owner=user)
    for card in cards:
        get_or_create_open_invoice(card)


@transaction.atomic
def close_invoice(invoice: CreditCardInvoice):
    if invoice.status == "paid":
        return invoice

    invoice.items.all().delete()
    transactions = Transaction.objects.filter(
        credit_card=invoice.credit_card,
        transaction_type="expense",
        occurred_on__gte=invoice.period_start,
        occurred_on__lte=invoice.period_end,
    ).select_related("installment")

    total = Decimal("0.00")
    for trx in transactions:
        total += Decimal(trx.amount)
        CreditCardInvoiceItem.objects.create(
            invoice=invoice,
            transaction=trx,
            installment=getattr(trx, "installment", None),
            description=trx.description or "",
            amount=trx.amount,
            occurred_on=trx.occurred_on,
        )

    invoice.total_amount = total
    invoice.status = "closed"
    invoice.save(update_fields=["total_amount", "status", "updated_at"])
    return invoice


def _get_or_create_payment_category(user):
    category, _ = Category.objects.get_or_create(
        owner=user,
        name="Pagamento de fatura",
        transaction_type="expense",
        defaults={"icon": "CC", "color": "#111827"},
    )
    return category


@transaction.atomic
def pay_invoice(invoice: CreditCardInvoice, account, amount, paid_on=None):
    paid_on = paid_on or date.today()
    category = _get_or_create_payment_category(invoice.owner)
    payment_amount = Decimal(amount)

    trx = Transaction.objects.create(
        owner=invoice.owner,
        account=account,
        credit_card=None,
        category=category,
        transaction_type="expense",
        description=f"Pagamento fatura {invoice.credit_card.name}",
        amount=payment_amount,
        occurred_on=paid_on,
    )

    CreditCardInvoicePayment.objects.create(
        invoice=invoice,
        account=account,
        transaction=trx,
        amount=payment_amount,
        paid_on=paid_on,
    )

    total_paid = (
        invoice.payments.aggregate(total=models.Sum("amount"))["total"] or Decimal("0.00")
    )
    invoice.paid_amount = total_paid
    if total_paid >= invoice.total_amount and invoice.total_amount > 0:
        invoice.status = "paid"
    invoice.save(update_fields=["paid_amount", "status", "updated_at"])
    return invoice


def _next_occurrence_date(current, frequency):
    if frequency == "weekly":
        return current + timedelta(days=7)
    if frequency == "yearly":
        return _add_months(current, 12)
    return _add_months(current, 1)


@transaction.atomic
def generate_recurrences(user, until_date=None):
    horizon = until_date or (date.today() + timedelta(days=60))
    count = 0
    recurrences = Recurrence.objects.select_related("account", "credit_card", "category").filter(
        owner=user, active=True
    )

    for rec in recurrences:
        if rec.transaction_type == "income" and not rec.account:
            continue
        if rec.transaction_type == "expense" and rec.source == "account" and not rec.account:
            continue
        if rec.transaction_type == "expense" and rec.source == "credit_card" and not rec.credit_card:
            continue

        start = rec.start_date
        end = rec.end_date or horizon
        if end < start:
            continue
        if horizon < start:
            continue

        existing = set(
            RecurrenceOccurrence.objects.filter(
                recurrence=rec, occurred_on__gte=start, occurred_on__lte=min(end, horizon)
            ).values_list("occurred_on", flat=True)
        )

        current = start
        while current <= end and current <= horizon:
            if current not in existing:
                account = rec.account if rec.transaction_type == "income" or rec.source == "account" else None
                credit_card = rec.credit_card if rec.transaction_type == "expense" and rec.source == "credit_card" else None
                trx = Transaction.objects.filter(
                    owner=user,
                    account=account,
                    credit_card=credit_card,
                    category=rec.category,
                    transaction_type=rec.transaction_type,
                    description=rec.description,
                    amount=rec.amount,
                    occurred_on=current,
                ).first()
                if not trx:
                    trx = Transaction.objects.create(
                        owner=user,
                        account=account,
                        credit_card=credit_card,
                        category=rec.category,
                        transaction_type=rec.transaction_type,
                        description=rec.description,
                        amount=rec.amount,
                        occurred_on=current,
                    )
                    count += 1
                RecurrenceOccurrence.objects.create(
                    recurrence=rec,
                    occurred_on=current,
                    transaction=trx,
                )
            current = _next_occurrence_date(current, rec.frequency)

    return count


def get_cashflow_projection(user, start_date=None, days=90):
    start = start_date or date.today()
    days = max(1, int(days or 90))
    end = start + timedelta(days=days - 1)

    initial = (
        Account.objects.filter(owner=user).aggregate(total=models.Sum("initial_balance"))["total"]
        or Decimal("0.00")
    )
    before = Transaction.objects.filter(
        owner=user, account__isnull=False, occurred_on__lt=start
    )
    income_before = before.filter(transaction_type="income").aggregate(total=models.Sum("amount"))["total"] or Decimal("0.00")
    expense_before = before.filter(transaction_type="expense").aggregate(total=models.Sum("amount"))["total"] or Decimal("0.00")
    starting_balance = initial + income_before - expense_before

    qs = Transaction.objects.filter(
        owner=user, account__isnull=False, occurred_on__gte=start, occurred_on__lte=end
    )
    aggregated = qs.values("occurred_on", "transaction_type").annotate(total=models.Sum("amount"))
    mapa = {}
    for item in aggregated:
        key = item["occurred_on"]
        if key not in mapa:
            mapa[key] = {"income": Decimal("0.00"), "expense": Decimal("0.00")}
        mapa[key][item["transaction_type"]] = item["total"] or Decimal("0.00")

    points = []
    total_income = Decimal("0.00")
    total_expense = Decimal("0.00")
    running = starting_balance
    for i in range(days):
        dia = start + timedelta(days=i)
        valores = mapa.get(dia, {"income": Decimal("0.00"), "expense": Decimal("0.00")})
        income = valores.get("income", Decimal("0.00"))
        expense = valores.get("expense", Decimal("0.00"))
        net = income - expense
        running += net
        total_income += income
        total_expense += expense
        points.append(
            {
                "date": dia.isoformat(),
                "incomes": float(income),
                "expenses": float(expense),
                "net": float(net),
                "balance": float(running),
            }
        )

    return {
        "start_date": start.isoformat(),
        "end_date": end.isoformat(),
        "days": days,
        "starting_balance": float(starting_balance),
        "totals": {
            "incomes": float(total_income),
            "expenses": float(total_expense),
            "net": float(total_income - total_expense),
        },
        "points": points,
    }
