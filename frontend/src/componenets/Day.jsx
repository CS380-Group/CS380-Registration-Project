import React from "react";
import PropTypes from "prop-types";

const Day = ({ day, onClick }) => {
    return (
        <div
            onClick={onClick}
            style={{
                border: "1px solid #ccc",
                padding: "10px",
                margin: "5px",
                cursor: "pointer",
                textAlign: "center"
            }}
        >
            {day}
        </div>
    );
};

Day.propTypes = {
    day: PropTypes.number.isRequired,
    onClick: PropTypes.func
};

export default Day;