from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("finance", "0003_credit_card_invoices"),
    ]

    operations = [
        migrations.CreateModel(
            name="RecurrenceOccurrence",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("occurred_on", models.DateField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("recurrence", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="occurrences", to="finance.recurrence")),
                ("transaction", models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="recurrence_occurrence", to="finance.transaction")),
            ],
            options={
                "ordering": ("-occurred_on", "-id"),
                "unique_together": {("recurrence", "occurred_on")},
            },
        ),
    ]
