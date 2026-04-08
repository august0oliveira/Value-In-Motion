from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("finance", "0002_category_color_category_icon"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="CreditCardInvoice",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("period_start", models.DateField()),
                ("period_end", models.DateField()),
                ("closing_date", models.DateField()),
                ("due_date", models.DateField()),
                ("status", models.CharField(choices=[("open", "Open"), ("closed", "Closed"), ("paid", "Paid")], default="open", max_length=10)),
                ("total_amount", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ("paid_amount", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("credit_card", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="invoices", to="finance.creditcard")),
                ("owner", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="credit_card_invoices", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "ordering": ("-period_end", "-id"),
                "unique_together": {("credit_card", "period_start", "period_end")},
            },
        ),
        migrations.CreateModel(
            name="CreditCardInvoiceItem",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("description", models.CharField(blank=True, default="", max_length=255)),
                ("amount", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ("occurred_on", models.DateField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("installment", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="invoice_items", to="finance.cardinstallment")),
                ("invoice", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="items", to="finance.creditcardinvoice")),
                ("transaction", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="invoice_items", to="finance.transaction")),
            ],
            options={
                "ordering": ("occurred_on", "id"),
                "unique_together": {("invoice", "transaction")},
            },
        ),
        migrations.CreateModel(
            name="CreditCardInvoicePayment",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("amount", models.DecimalField(decimal_places=2, max_digits=12)),
                ("paid_on", models.DateField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("account", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="invoice_payments", to="finance.account")),
                ("invoice", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="payments", to="finance.creditcardinvoice")),
                ("transaction", models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="invoice_payment", to="finance.transaction")),
            ],
            options={
                "ordering": ("-paid_on", "-id"),
            },
        ),
    ]
