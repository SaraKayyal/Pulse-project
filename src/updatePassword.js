const pulse = require('./pulse.js');

pulse.updatePasswords()
    .then(() => {
        console.log('Password update completed successfully.');
        process.exit(0); // Exit with a success code
    })
    .catch((error) => {
        console.error('Error updating passwords:', error);
        process.exit(1); // Exit with an error code
    });