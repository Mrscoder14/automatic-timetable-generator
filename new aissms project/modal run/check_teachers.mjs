
// Use built-in fetch (Node 18+)
// If not available, this will throw.
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
