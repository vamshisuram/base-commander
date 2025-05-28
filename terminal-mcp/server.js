const fs = require('fs');
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
// Terminal command runner
app.post('/mcp/terminal', (req, res) => {
  console.log("MCP request body >>> ", req.body);
  const command = req.body.content?.command;
  if (!command) return res.status(400).json({ error: 'Missing command' });

  exec(command, (error, stdout, stderr) => {
    res.json({
      role: 'assistant',
      name: 'terminal',
      content: {
        stdout,
        stderr,
        error: error?.message
      }
    });
  });
});

// Simple SQL-like database simulation
app.post('/mcp/db', (req, res) => {
  console.log("MCP request body >>> ", req.body);
  const query = req.body.content?.query;
  if (!query) return res.status(400).json({ error: 'Missing query' });

  // Fake in-memory DB example
  const fakeUsers = [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }];
  if (query.toLowerCase().includes('select')) {
    return res.json({ content: fakeUsers });
  }

  res.status(400).json({ error: 'Unsupported query' });
});

// Log prompt
app.post('/mcp/log', (req, res) => {
  console.log("MCP request body >>> ", req.body);
  const prompt = req.body.content?.message;
  if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

  fs.appendFile('logs.txt', `${new Date().toISOString()} - ${prompt}\n`, (err) => {
    if (err) return res.status(500).json({ error: 'Failed to log' });
    res.json({ status: 'logged' });
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
