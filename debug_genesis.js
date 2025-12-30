const en = require('./assets/data/en_kjv.json');

const genesis = en.find(b => b.name === 'Genesis');
if (genesis) {
    console.log(`Genesis found. Chapters: ${genesis.chapters.length}`);
    for (let i = 0; i < 30; i++) {
        const chapter = genesis.chapters[i];
        console.log(`Chapter ${i + 1} verses: ${chapter ? chapter.length : 'MISSING'}`);
    }
} else {
    console.log('Genesis NOT found in JSON');
}
