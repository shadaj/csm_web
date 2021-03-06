import React, { useEffect, useState } from "react";
import { Switch, Route, Redirect } from "react-router-dom";
import PropTypes from "prop-types";
import { fetchJSON, fetchWithMethod, HTTP_METHODS } from "../utils/api";
import { SPACETIME_SHAPE } from "../utils/types";
import Modal from "./Modal";
import XIcon from "../../static/frontend/img/x.svg";
import { SectionDetail, InfoCard, ATTENDANCE_LABELS, SectionSpacetime, ROLES } from "./Section";

export default function StudentSection({
  course,
  courseTitle,
  mentor,
  spacetimes,
  override,
  associatedProfileId,
  url
}) {
  return (
    <SectionDetail
      course={course}
      courseTitle={courseTitle}
      userRole={ROLES.STUDENT}
      links={[
        ["Section", url],
        ["Attendance", `${url}/attendance`]
      ]}
    >
      <Switch>
        <Route
          path={`${url}/attendance`}
          render={() => <StudentSectionAttendance associatedProfileId={associatedProfileId} />}
        />
        <Route
          path={url}
          render={() => (
            <StudentSectionInfo
              mentor={mentor}
              spacetimes={spacetimes}
              override={override}
              associatedProfileId={associatedProfileId}
            />
          )}
        />
      </Switch>
    </SectionDetail>
  );
}

StudentSection.propTypes = {
  course: PropTypes.string.isRequired,
  courseTitle: PropTypes.string.isRequired,
  mentor: PropTypes.shape({ email: PropTypes.string.isRequired, name: PropTypes.string.isRequired }),
  spacetimes: PropTypes.arrayOf(SPACETIME_SHAPE).isRequired,
  override: PropTypes.object,
  associatedProfileId: PropTypes.number.isRequired,
  url: PropTypes.string.isRequired
};

// eslint-disable-next-line no-unused-vars
function StudentSectionInfo({ mentor, spacetimes, override, associatedProfileId }) {
  return (
    <React.Fragment>
      <h3 className="section-detail-page-title">My Section</h3>
      <div className="section-info-cards-container">
        {mentor && (
          <InfoCard title="Mentor">
            <h5>{mentor.name}</h5>
            <a href={`mailto:${mentor.email}`}>{mentor.email}</a>
          </InfoCard>
        )}
        {spacetimes.map(({ override, ...spacetime }, index) => (
          <SectionSpacetime
            manySpacetimes={spacetimes.length > 1}
            index={index}
            key={spacetime.id}
            spacetime={spacetime}
            override={override}
          />
        ))}
        <DropSection profileId={associatedProfileId} />
      </div>
    </React.Fragment>
  );
}

StudentSectionInfo.propTypes = {
  mentor: PropTypes.shape({ email: PropTypes.string.isRequired, name: PropTypes.string.isRequired }),
  spacetimes: PropTypes.arrayOf(SPACETIME_SHAPE).isRequired,
  override: PropTypes.object,
  associatedProfileId: PropTypes.number.isRequired
};

class DropSection extends React.Component {
  static STAGES = Object.freeze({ INITIAL: "INITIAL", CONFIRM: "CONFIRM", DROPPED: "DROPPED" });
  static propTypes = { profileId: PropTypes.number.isRequired };

  constructor(props) {
    super(props);
    this.state = { stage: DropSection.STAGES.INITIAL };
    this.performDrop = this.performDrop.bind(this);
  }

  performDrop() {
    //TODO: Handle API failure
    fetchWithMethod(`students/${this.props.profileId}/drop`, HTTP_METHODS.PATCH).then(() =>
      this.setState({ stage: DropSection.STAGES.DROPPED })
    );
  }

  render() {
    switch (this.state.stage) {
      case DropSection.STAGES.INITIAL:
        return (
          <InfoCard title="Drop Section" showTitle={false}>
            <h5>Drop Section</h5>
            <button className="danger-btn" onClick={() => this.setState({ stage: DropSection.STAGES.CONFIRM })}>
              <XIcon height="1.3em" width="1.3em" />
              Drop
            </button>
          </InfoCard>
        );
      case DropSection.STAGES.CONFIRM:
        return (
          <Modal className="drop-confirmation" closeModal={() => this.setState({ stage: DropSection.STAGES.INITIAL })}>
            <h5>Are you sure you want to drop?</h5>
            <p>You are not guaranteed an available spot in another section!</p>
            <button className="danger-btn" onClick={this.performDrop}>
              Confirm
            </button>
          </Modal>
        );
      case DropSection.STAGES.DROPPED:
        return <Redirect to="/" />;
    }
  }
}

function StudentSectionAttendance({ associatedProfileId }) {
  const [state, setState] = useState({ attendances: null, loaded: false });
  useEffect(() => {
    fetchJSON(`/students/${associatedProfileId}/attendances`).then(attendances =>
      setState({ attendances, loaded: true })
    );
  }, [associatedProfileId]);
  const { attendances, loaded } = state;
  return !loaded ? null : (
    <table id="attendance-table" className="standalone-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {attendances.map(({ presence, date }) => {
          const [label, cssSuffix] = ATTENDANCE_LABELS[presence];
          return (
            <tr key={date}>
              <td>{date}</td>
              <td className="status">
                <div style={{ backgroundColor: `var(--csm-attendance-${cssSuffix})` }}>{label}</div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

StudentSectionAttendance.propTypes = { associatedProfileId: PropTypes.number.isRequired };
