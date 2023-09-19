const axios = require('axios');
const cron = require('node-cron');

const url = process.env.DELETE_URL;
const key = process.env.DELETE_SECURE_CODE;

function executeRequest() {
    axios.post(url, {
        key: key
    })
        .then((response) => {
            console.log(`Request success: ${response.status}`);
        })
        .catch((error) => {
            console.error(`Request failed: ${error}`);
        });
}

// Planifier pour exécuter tous les jours à 23h59
cron.schedule('59 23 * * *', executeRequest, {
    scheduled: true,
    timezone: "Europe/Paris"
});

console.log("Scheduled job set up for 23:59 daily.");
