# Generated by Django 3.0.3 on 2020-03-13 00:04

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('scheduler', '0010_student_banned'),
    ]

    operations = [
        migrations.AlterField(
            model_name='spacetime',
            name='location',
            field=models.CharField(max_length=200),
        ),
    ]