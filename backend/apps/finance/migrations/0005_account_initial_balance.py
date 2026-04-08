from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("finance", "0004_recurrence_occurrence"),
    ]

    operations = [
        migrations.AddField(
            model_name="account",
            name="initial_balance",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12),
        ),
    ]
