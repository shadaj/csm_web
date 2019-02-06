import React from "react";
import { Redirect } from "react-router-dom";
import { groupBy } from "lodash";
import moment from "moment";
import { post } from "../utils/api";
import { alert_modal } from "../utils/common";

const API_TIME_FORMAT = "HH:mm:ss";
const DISPLAY_TIME_FORMAT = "HH:mm A";
const dayOfWeek = {
  Monday: 0,
  Tuesday: 1,
  Wednesday: 2,
  Thursday: 3,
  Friday: 4,
  Saturday: 5,
  Sunday: 6
};

function CourseDetail(props) {
  return (
    <div className="course-hero">
      <h1 className="course-hero-label">{props.course}</h1>
      {props.enrolled && (
        <h3 className="course-hero-alert">You are enrolled in this course</h3>
      )}
      {!props.enrollmentOpen && (
        <h3 className="course-hero-alert">
          This course is not open for enrollment
        </h3>
      )}
    </div>
  );
}

class Course extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      course: props.course,
      sections: {},
      enrolled: false,
      enrollmentOpen: false,
      viewSection: null
    };
  }

  componentDidUpdate(prevProps) {
    if (this.props.course !== prevProps.course) {
      this.setState(
        (state, props) => {
          return {
            course: props.course,
            sections: {},
            enrolled: false,
            enrollmentOpen: false
          };
        },
        () => this.updateCourse()
      );
    }
  }

  componentDidMount() {
    this.updateCourse();
  }

  updateCourse() {
    const now = moment();
    const enrollmentStart = moment(this.state.course.enrollmentStart);
    const enrollmentEnd = moment(this.state.course.enrollmentEnd);
    this.setState({
      enrollmentOpen: now > enrollmentStart && now < enrollmentEnd
    });

    fetch("/scheduler/profiles/")
      .then(response => response.json())
      .then(profiles => {
        this.setState({
          enrolled: profiles
            .map(profile => profile.course)
            .includes(state.course.id)
        });
      });
    fetch(`/scheduler/courses/${this.state.course.name}/sections/`)
      .then(response => response.json())
      .then(sections => {
        this.setState({
          sections: groupBy(
            sections,
            section => section.defaultSpacetime.dayOfWeek
          )
        });
      });
  }

  render() {
    if (this.state.viewSection != null) {
      return <Redirect to={`/sections/${this.state.viewSection}`} push />;
    }

    const dayComparator = (item1, item2) => {
      const day1 = dayOfWeek[item1[0]];
      const day2 = dayOfWeek[item2[0]];
      return day1 - day2;
    };

    const days = Object.entries(this.state.sections)
      .sort(dayComparator)
      .map(item => {
        const [day, sections] = item;
        return (
          <Day
            key={day}
            enrolled={this.state.enrolled}
            enrollmentOpen={this.state.enrollmentOpen}
            day={day}
            sections={sections}
            update={() => this.updateCourse()}
            viewSection={id => this.setState({ viewSection: id })}
          />
        );
      });

    const dayHeaders = Object.entries(this.state.sections)
      .sort(dayComparator)
      .map(item => {
        const [day, sections] = item;
        return (
          <li key={day}>
            <a href="#">{day}</a>
          </li>
        );
      });

    return (
      <div>
        <div>
          <CourseDetail
            enrolled={this.state.enrolled}
            enrollmentOpen={this.state.enrollmentOpen}
            course={this.state.course.name}
          />
        </div>
        <div>
          <ul data-uk-tab="connect: #days-list">{dayHeaders}</ul>
          <ul id="days-list" className="uk-switcher">
            {days}
          </ul>
        </div>
      </div>
    );
  }
}

function Day(props) {
  const sections = props.sections
    .sort((section1, section2) => {
      const time1 = moment(
        section1.defaultSpacetime.startTime,
        API_TIME_FORMAT
      );
      const time2 = moment(
        section2.defaultSpacetime.startTime,
        API_TIME_FORMAT
      );
      return time1 - time2;
    })
    .map((section, index) => (
      <SectionEnroll
        enrolled={props.enrolled}
        enrollmentOpen={props.enrollmentOpen}
        section={section}
        key={section.id}
        update={props.update}
        viewSection={props.viewSection}
      />
    ));
  return (
    <div>
      <ul className="uk-list uk-list-striped">{sections}</ul>
    </div>
  );
}

function SectionEnroll(props) {
  const spacetime = props.section.defaultSpacetime;
  const startTime = moment(spacetime.startTime, API_TIME_FORMAT).format(
    DISPLAY_TIME_FORMAT
  );
  const location = spacetime.location;

  function handleClick(event) {
    // TODO is there a nicer way to do this with async rather than this external
    // variable?
    var ok = false;
    post(`scheduler/sections/${props.section.id}/enroll`, {})
      .then(response => {
        ok = response.ok;
        return response.json();
      })
      .then(body => {
        if (!ok) {
          let errorMessage;
          switch (body.shortCode) {
            case "already_enrolled":
              errorMessage =
                "You are already enrolled in this course. You can only enroll in one section per course.";
              break;
            case "course_closed":
              errorMessage =
                "This course is not currently open for enrollment.";
              break;
            case "section_full":
              errorMessage =
                "This course is not currently open for enrollment.";
              break;
            default:
              errorMessage = "An unknown error has occurred.";
              console.log("An unknown error has occurred.");
              console.log(body.message);
          }
          alert_modal(errorMessage, () => {});
        } else {
          alert_modal(
            `You've successfully enrolled in section ${
              props.section.id
            } at ${location}, ${startTime}`,
            () => props.viewSection(props.section.id)
          );
        }

        // Updates the Course component
        props.update();
      });
  }

  const available = props.section.capacity - props.section.enrolledStudents;
  const pluralized_spot = available === 1 ? "spot" : "spots";
  const disabled = props.enrolled || !props.enrollmentOpen || available === 0;

  return (
    <li>
      <h4>
        {location} - {startTime}
      </h4>
      <p>
        {props.section.enrolledStudents}/{props.section.capacity} - {available}{" "}
        {pluralized_spot} available
      </p>
      <button
        className="uk-button uk-button-primary"
        disabled={disabled}
        onClick={handleClick}
      >
        Enroll
      </button>
    </li>
  );
}

export default Course;
