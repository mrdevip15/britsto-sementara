// Import the necessary functions from scheduleMaker.js
const { generateTimeSlots, mapEventsToIntervals, teacherColors } = require('./scheduleMaker');

// Helper function to get teacher color
function getTeacherColor(subject) {
    const teacherName = subject.split(" - ")[0];
    return teacherColors[teacherName] || '#e9ecef';
}

module.exports = {
    generateTimeSlots,
    mapEventsToIntervals,
    getTeacherColor
}; 