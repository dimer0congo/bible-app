const fs = require('fs');
const path = require('path');

try {
    const dataPath = path.join(__dirname, '../assets/data/fr_apee.json');
    let rawData = fs.readFileSync(dataPath, 'utf8');
    // Strip BOM if present
    if (rawData.charCodeAt(0) === 0xFEFF) {
        rawData = rawData.slice(1);
    }
    const data = JSON.parse(rawData);

    // Assuming structure is array of books with 'name' property
    const bookNames = data.map(b => b.name);
    console.log("Total Books:", bookNames.length);
    console.log("First Book Name:", bookNames[0]);
    console.log("First Verse Content:", data[0].chapters[0][0]);
} catch (e) {
    console.error("Error reading file:", e);
}
