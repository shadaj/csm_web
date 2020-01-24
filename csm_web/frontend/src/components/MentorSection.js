import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { fetchJSON } from "../utils/api";
import { SectionDetail, InfoCard, SectionSpacetime } from "./Section";
import { Switch, Route } from "react-router-dom";
import { groupBy } from "lodash";
import CopyIcon from "../../static/frontend/img/copy.svg";
import CheckCircle from "../../static/frontend/img/check_circle.svg";
import { ATTENDANCE_LABELS } from "./Section";
export default function MentorSection({ id, url, course, courseTitle, spacetime, override }) {
  const [{ students, attendances, loaded }, setState] = useState({ students: [], attendances: {}, loaded: false });
  useEffect(() => {
    setState({ students: [], attendances: {}, loaded: false });
    fetchJSON(`/sections/${id}/students/`).then(data => {
      const students = data.map(({ name, email, id }) => ({ name, email, id }));
      const attendances = groupBy(
        data
          .flatMap(({ name, id, attendances }) =>
            attendances.map(attendance => ({ ...attendance, student: { name, id } }))
          )
          .reverse(),
        attendance => attendance.weekStart
      );
      setState({ students, attendances, loaded: true });
    });
  }, [id]);

  return (
    <SectionDetail
      course={course}
      courseTitle={courseTitle}
      isStudent={false}
      links={[
        ["Section", url],
        ["Attendance", `${url}/attendance`],
        ["Roster", `${url}/roster`]
      ]}
    >
      <Switch>
        <Route
          path={`${url}/attendance`}
          render={() => <MentorSectionAttendance attendances={attendances} loaded={loaded} />}
        />
        <Route path={`${url}/roster`} render={() => <MentorSectionRoster students={students} loaded={loaded} />} />
        <Route
          path={url}
          render={() => (
            <MentorSectionInfo students={students} loaded={loaded} spacetime={spacetime} override={override} />
          )}
        />
      </Switch>
    </SectionDetail>
  );
}

MentorSection.propTypes = {
  id: PropTypes.number.isRequired,
  course: PropTypes.string.isRequired,
  courseTitle: PropTypes.string.isRequired,
  spacetime: PropTypes.object.isRequired,
  override: PropTypes.object,
  url: PropTypes.string.isRequired
};

const MONTH_NUMBERS = Object.freeze({
  Jan: 1,
  Feb: 2,
  Mar: 3,
  Apr: 4,
  May: 5,
  Jun: 6,
  Jul: 7,
  Aug: 8,
  Sep: 9,
  Oct: 10,
  Nov: 11,
  Dec: 12
});

function parseDate(dateString) {
  /*
   * Example:
   * parseDate("Jan. 6, 2020") --> "1/6"
   */
  const [month, dayAndYear] = dateString.split(".");
  const day = dayAndYear.split(",")[0].trim();
  return `${MONTH_NUMBERS[month]}/${day}`;
}

class MentorSectionAttendance extends React.Component {
  static propTypes = {
    loaded: PropTypes.bool.isRequired,
    attendances: PropTypes.object.isRequired
  };

  state = { selectedWeek: null };

  render() {
    const { attendances, loaded } = this.props;
    const selectedWeek = this.state.selectedWeek || (loaded && Object.keys(attendances)[0]);
    return (
      <React.Fragment>
        <h3 className="section-detail-page-title">Attendance</h3>
        {loaded && (
          <div id="mentor-attendance">
            <div id="attendance-date-tabs-container">
              {Object.keys(attendances).map(weekStart => (
                <div
                  key={weekStart}
                  className={weekStart === selectedWeek ? "active" : ""}
                  onClick={() => this.setState({ selectedWeek: weekStart })}
                >
                  {parseDate(weekStart)}
                </div>
              ))}
            </div>
            <table id="mentor-attendance-table">
              <tbody>
                {selectedWeek &&
                  attendances[selectedWeek].map(({ id, student, presence }) => (
                    <tr key={id}>
                      <td>{student.name}</td>
                      <td>
                        <select
                          value={presence}
                          className="select-css"
                          style={{
                            backgroundColor: `var(--csm-attendance-${ATTENDANCE_LABELS[presence][1]})`
                          }}
                        >
                          {Object.entries(ATTENDANCE_LABELS).map(([value, [label]]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
        {!loaded && <h5> Loading attendances...</h5>}
      </React.Fragment>
    );
  }
}

function MentorSectionInfo({ students, loaded, spacetime, override }) {
  return (
    <React.Fragment>
      <h3 className="section-detail-page-title">My Section</h3>
      <div className="section-info-cards-container">
        <InfoCard title="Students">
          {loaded && (
            <table id="students-table">
              <thead>
                <tr>
                  <th>Name</th>
                </tr>
              </thead>
              <tbody>
                {students.map(({ name, id }) => (
                  <tr key={id}>
                    <td>{name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!loaded && <h5>Loading students...</h5>}
        </InfoCard>
        <SectionSpacetime spacetime={spacetime} override={override} />
      </div>
    </React.Fragment>
  );
}

MentorSectionInfo.propTypes = {
  students: PropTypes.arrayOf(PropTypes.shape({ name: PropTypes.string.isRequired, id: PropTypes.number.isRequired }))
    .isRequired,
  loaded: PropTypes.bool.isRequired,
  spacetime: PropTypes.object.isRequired,
  override: PropTypes.object
};

function MentorSectionRoster({ students, loaded }) {
  const [emailsCopied, setEmailsCopied] = useState(false);
  const handleCopyEmails = () => {
    navigator.clipboard.writeText(students.map(({ email }) => email).join(" ")).then(() => {
      setEmailsCopied(true);
      setTimeout(() => setEmailsCopied(false), 1500);
    });
  };
  return (
    <React.Fragment>
      <h3 className="section-detail-page-title">Roster</h3>
      {loaded && (
        <table className="standalone-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>
                <CopyIcon id="copy-student-emails" height="1em" width="1em" onClick={handleCopyEmails} />
                {emailsCopied && (
                  <CheckCircle id="copy-student-emails-success" color="green" height="1em" width="1em" />
                )}
              </th>
            </tr>
          </thead>
          <tbody>
            {students.map(({ name, email, id }) => (
              <tr key={id}>
                <td>{name}</td>
                <td>{email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {!loaded && <h5>Loading roster...</h5>}
    </React.Fragment>
  );
}

MentorSectionRoster.propTypes = {
  students: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      email: PropTypes.string.isRequired
    })
  ).isRequired,
  loaded: PropTypes.bool.isRequired
};
