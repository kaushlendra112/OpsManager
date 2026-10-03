const app = require('./app');
const { initDb } = require('./db');

initDb();

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
});
