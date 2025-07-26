const { jsPDF } = require("jspdf");
require("jspdf-autotable");

// Sample input data format
const scheduleInput = {
    "Senin": [
        { subject: "Najwa - Aqila", time: "19:00 - 20:30" }
    ],
    "Selasa": [
        { subject: "Azizah - Shayna", time: "10:00 - 11:30" },
        { subject: "Yandri - River", time: "19:00 - 20:30" }
    ],
    "Rabu": [
        { subject: "Azizah - Zahirah", time: "10:00 - 11:30" },
        { subject: "Dayat - Aqila", time: "18:00 - 19:30" },
        { subject: "Fitra - Faiz & Eza", time: "19:00 - 20:30" }
    ],
    "Kamis": [
        { subject: "Azizah - Shayna", time: "10:00 - 11:30" },
        { subject: "Farhan - Avril", time: "18:00 - 19:30" },
        { subject: "Yandri - River", time: "19:00 - 20:30" }
    ],
    "Jumat": [
        { subject: "Azizah - Zahirah", time: "10:00 - 11:30" },
        { subject: "Dayat - Avril", time: "15:00 - 16:30" },
        { subject: "Yandri - River", time: "17:00 - 18:30" },
        { subject: "Dayat - Aqila", time: "19:00 - 20:30" }
    ],
    "Sabtu": [
        { subject: "Azizah - Shayna", time: "10:00 - 11:30" },
        { subject: "Dayat - Avril", time: "15:00 - 16:30" },
        { subject: "Najwa", time: "19:00 - 20:30" }
    ],
    "Minggu": [
        { subject: "Wawa - Aqila", time: "10:00 - 11:30" }
    ],
    // "weekLong": [
    //     { subject: "Tidur", time: "01:00 - 07:00" },
            //     { subject: "Makan siang di BritsEdu", time: "12:00 - 12:50" } // Entry spanning all days
    // ]
};

// Step 1: Collect unique teacher names
const teachers = new Set();

Object.values(scheduleInput).forEach(dayEvents => {
    dayEvents.forEach(({ subject }) => {
        const teacherName = subject.split(" - ")[0]; // Get the teacher's name
        teachers.add(teacherName); // Add to the Set for uniqueness
    });
});

const uniqueTeachers = Array.from(teachers); // Convert Set to Array

// Step 2: Assign each teacher a unique pastel color

const pastelColors = [
    [245, 176, 205],
    [187, 213, 240],
    [176, 221, 216],
    [237, 151, 128],
    [100, 156, 143],
    [137, 99, 158],
    [46, 82, 134],
    [129, 45, 61],
    [242, 114, 127],
    [154, 206, 108],
    [144, 129, 126],
    [140, 115, 180],
    [248, 235, 167],
    [154, 154, 190],
    [193, 107, 132]
];
const teacherColors = {};
uniqueTeachers.forEach((teacher, index) => {
    // Use modulo to loop over pastelColors if there are more teachers than colors
    const [r, g, b] = pastelColors[index % pastelColors.length];
    teacherColors[teacher] = `rgb(${r}, ${g}, ${b})`;
});


// Utility functions
function parseTimeToMinutes(time) {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
}

function formatTime(minutes) {
    const hours = Math.floor(minutes / 60).toString().padStart(2, "0");
    const mins = (minutes % 60).toString().padStart(2, "0");
    return `${hours}:${mins}`;
}

function generateTimeSlots(schedule) {
    const allTimes = new Set();
    
    // Collect all unique times
    Object.values(schedule).forEach(dayEvents => {
        dayEvents.forEach(event => {
            const [startTime, endTime] = event.time.split(' - ');
            allTimes.add(startTime);
            allTimes.add(endTime);
        });
    });

    // Convert to array and sort
    const sortedTimes = Array.from(allTimes).sort();
    
    // Create intervals
    const intervals = [];
    for (let i = 0; i < sortedTimes.length - 1; i++) {
        const start = parseTimeToMinutes(sortedTimes[i]);
        const end = parseTimeToMinutes(sortedTimes[i + 1]);
        if (start < end) {
            intervals.push({
                start,
                end,
                startStr: sortedTimes[i],
                endStr: sortedTimes[i + 1]
            });
        }
    }
    
    return intervals;
}

function mapEventsToIntervals(schedule, intervals) {
    const mappedSchedule = {};

    Object.entries(schedule).forEach(([day, events]) => {
        let daySchedule = Array(intervals.length).fill("");

        events.forEach(event => {
            const [eventStart, eventEnd] = event.time.split(" - ").map(parseTimeToMinutes);
            
            // Find all intervals that this event spans
            const spanningIntervals = intervals.filter(interval => 
                eventStart <= interval.end && eventEnd >= interval.start
            );
            
            if (spanningIntervals.length > 0) {
                const startIndex = intervals.indexOf(spanningIntervals[0]);
                const rowSpan = spanningIntervals.length;

                // Add the event at the start index
                daySchedule[startIndex] = {
                    subject: event.subject,
                    rowSpan: rowSpan,
                    tentorId: event.tentorId
                };

                // Mark subsequent intervals as taken
                for (let i = 1; i < rowSpan; i++) {
                    daySchedule[startIndex + i] = null;
                }
            }
        });

        mappedSchedule[day] = daySchedule;
    });

    return mappedSchedule;
}

// Export the functions and data that are needed
module.exports = {
    generateTimeSlots,
    mapEventsToIntervals,
    teacherColors,
    // Add any other functions or data you need to export
};
