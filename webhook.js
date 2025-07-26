const express = require('express');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
const path = require('path');

const app = express();
const port = 6969;

// Middleware to parse JSON body
app.use(bodyParser.json());

// Webhook route to handle GitHub push event
app.post('/webhook', (req, res) => {
    const payload = req.body;
    // Check if the webhook is from a push to the main branch

        console.log('GitHub push detected to main branch!');
        
        // Execute the command sequence
        const command = `source /home/tyogfxma/nodevenv/ggweb/22/bin/activate && cd /home/tyogfxma/ggweb && git pull origin main`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing command: ${error.message}`);
                return res.status(500).send(`Error: ${error.message}`);
            }
            if (stderr) {
                console.error(`stderr: ${stderr}`);
                return res.status(500).send(`stderr: ${stderr}`);
            }
            // Output of the command
            console.log(`stdout: ${stdout}`);
            res.status(200).send('Git pull successful');
        });

});

// Start the server
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
