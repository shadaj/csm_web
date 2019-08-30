from django.test import TestCase
from rest_framework.serializers import ValidationError
from datetime import datetime, timedelta
from scheduler.factories import (
    SpacetimeFactory,
    OverrideFactory,
    CourseFactory,
    SectionFactory,
    StudentFactory,
)


class SpacetimeTest(TestCase):
    def setUp(self):
        course = CourseFactory.create()
        section = SectionFactory.create(course=course)
        self.spacetime = SpacetimeFactory.create(section=section)

    def test_spacetime_without_override(self):
        self.assertEqual(self.spacetime.location, self.spacetime._location)
        self.assertEqual(self.spacetime.day_of_week, self.spacetime._day_of_week)
        self.assertEqual(self.spacetime.start_time, self.spacetime._start_time)
        self.assertEqual(self.spacetime.duration, self.spacetime._duration)

    def test_spacetime_with_override(self):
        override = OverrideFactory.create(overriden_spacetime=self.spacetime)
        self.assertEqual(self.spacetime.location, override.spacetime.location)
        self.assertEqual(self.spacetime.day_of_week, override.spacetime.day_of_week)
        self.assertEqual(self.spacetime.start_time, override.spacetime.start_time)
        self.assertEqual(self.spacetime.duration, override.spacetime.duration)

    def test_spacetime_with_expired_override(self):
        override = OverrideFactory.create(
            overriden_spacetime=self.spacetime,
            date=(datetime.now() - timedelta(days=5)),
        )
        self.assertTrue(override.is_expired())
        self.assertEqual(self.spacetime.location, self.spacetime._location)
        self.assertEqual(self.spacetime.day_of_week, self.spacetime._day_of_week)
        self.assertEqual(self.spacetime.start_time, self.spacetime._start_time)
        self.assertEqual(self.spacetime.duration, self.spacetime._duration)


class CourseTest(TestCase):
    def test_enrollment_start_after_end_validation(self):
        with self.assertRaises(ValidationError):
            CourseFactory.create(
                enrollment_start=datetime.now(),
                enrollment_end=(datetime.now() - timedelta(days=1)),
                valid_until=(datetime.now() + timedelta(days=10)),
            )

    def test_valid_until_after_enrollment(self):
        with self.assertRaises(ValidationError):
            CourseFactory.create(
                enrollment_start=datetime.now(),
                enrollment_end=(datetime.now() + timedelta(days=1)),
                valid_until=(datetime.now() - timedelta(days=10)),
            )