
const fetch = require('node-fetch'); // If node-fetch is available? Or use builtin fetch if node 18+

// Try builtin fetch first
async function run() {
    try {
        const res = await fetch('http://localhost:5000/api/teachers');
        const data = await res.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(e);
    }
}
run();
