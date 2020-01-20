# Generated by Django 3.0.1 on 2020-01-03 23:30

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('scheduler', '0006_auto_20190915_1227'),
    ]

    operations = [
        migrations.AddField(
            model_name='course',
            name='title',
            field=models.CharField(default='hi', max_length=100),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name='course',
            name='name',
            field=models.SlugField(max_length=16, unique_for_month='enrollment_start'),
        ),
    ]