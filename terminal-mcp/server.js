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

// POST endpoint for MCP-style requests
app.post('/mcp', (req, res) => {
  const message = req.body;

  // Basic MCP format validation
  if (!message || message.role !== 'user' || !message.content?.command) {
    return res.status(400).json({
      role: "tool",
      name: "terminal",
      content: { error: "Invalid MCP format. Expected 'command' inside 'content'." }
    });
  }

  const command = message.content.command;

  exec(command, (error, stdout, stderr) => {
    let responseContent = {};

    if (error) {
      responseContent.error = error.message;
    } else if (stderr) {
      responseContent.stderr = stderr;
    } else {
      responseContent.stdout = stdout;
    }

    res.json({
      role: "tool",
      name: "terminal",
      content: responseContent
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
