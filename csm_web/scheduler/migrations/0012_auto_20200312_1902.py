# Generated by Django 3.0.3 on 2020-03-13 02:02

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('scheduler', '0011_auto_20200312_1704'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='attendance',
            options={'ordering': ('date',)},
        ),
        migrations.AddIndex(
            model_name='attendance',
            index=models.Index(fields=['date'], name='scheduler_a_date_e76868_idx'),
        ),
    ]
