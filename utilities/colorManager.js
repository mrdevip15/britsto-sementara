const crypto = require('crypto');

// Expanded pastel color palette - 50 visually distinct colors
const PASTEL_COLORS = [
    '#cf7198', '#6c9fd6', '#65d4c7', '#d47257', '#5dad9b',
    '#9168a7', '#496fa3', '#a76161', '#d3707a', '#8ec75d',
    '#856761', '#866dad', '#b9aa5f', '#8585b9', '#ce8197' // Thistle
];

class ColorManager {
    constructor() {
        // Persistent color storage
        this.colorMap = new Map();
    }

    // Generate a consistent hash for an entity
    _generateHash(key) {
        return crypto.createHash('md5').update(key.toString()).digest('hex');
    }

    // Get a consistent color for an entity
    getColor(key, type = 'default') {
        // Create a unique identifier combining type and key
        const uniqueKey = `${type}_${key}`;
        
        // Check if color already exists
        if (this.colorMap.has(uniqueKey)) {
            return this.colorMap.get(uniqueKey);
        }

        // Generate a hash to deterministically select a color
        const hash = this._generateHash(uniqueKey);
        const colorIndex = parseInt(hash.slice(0, 8), 16) % PASTEL_COLORS.length;
        const selectedColor = PASTEL_COLORS[colorIndex];

        // Store and return the color
        this.colorMap.set(uniqueKey, selectedColor);
        return selectedColor;
    }

    // Get color for tentor - check for manually set color first
    getTentorColor(tentor) {
        // If tentor is just an ID, use the default algorithm
        if (typeof tentor === 'string' || typeof tentor === 'number') {
            return this.getColor(tentor, 'tentor');
        }
        
        // If tentor is an object with color property, use that color
        if (tentor && tentor.color) {
            return tentor.color;
        }
        
        // Otherwise, use the default algorithm with the tentor's ID
        return this.getColor(tentor.id || tentor, 'tentor');
    }

    getSubjectColor(subject) {
        return this.getColor(subject, 'subject');
    }

    getClassColor(classId) {
        return this.getColor(classId, 'class');
    }
    
    // Returns the full palette for color pickers
    getAllColors() {
        return [...PASTEL_COLORS];
    }
}

module.exports = new ColorManager(); 