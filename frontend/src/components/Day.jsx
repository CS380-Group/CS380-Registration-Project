// frontend/src/components/Day.jsx

import React from "react";
import PropTypes from "prop-types";

const Day = ({ day, onClick }) => {
    const display = typeof day === "number" ? day : (day?.date ? day.date.getDate() : "");
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
            {display}
        </div>
    );
};

Day.propTypes = {
    day: PropTypes.oneOfType([PropTypes.number, PropTypes.object]).isRequired,
    onClick: PropTypes.func
};

export default Day;