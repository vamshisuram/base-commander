const express = require('express');
const { exec } = require('child_process');
const app = express();
const PORT = 3000;

app.use(express.json()); // for parsing JSON bodies

// LLM would create the command and post it

// POST request: body = { "cmd": "ls" }
app.post('/run', (req, res) => {
  const { cmd } = req.body;
  if (!cmd) return res.status(400).send('No command provided');

  exec(cmd, (error, stdout, stderr) => {
    if (error) return res.status(500).send(`Error: ${error.message}`);
    if (stderr) return res.status(200).send(`Stderr: ${stderr}`);
    res.send(stdout);
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
