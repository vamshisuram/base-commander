const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();
const PORT = 4000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

// Render the form UI
app.get('/', (req, res) => {
  res.render('index', { output: null });
});

// Handle form submission
app.post('/run', async (req, res) => {
  const prompt = req.body.prompt;

  // Translate user prompt to command — naive version

  // You can later add NLP for prompt-to-command mapping

  // Use LLM to create a prompt! and send that prompt
  let command;
  try {
    const lmResponse = await fetch('http://localhost:1234/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: "your-model-name", // replace with actual model used in LM Studio
        messages: [
          {
            role: "system",
            content: "You are an AI that translates user prompts into shell commands. Only respond with the exact shell command without any explanation."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.2
      })
    });

    const lmData = await lmResponse.json();
    command = lmData.choices[0].message.content.trim();
    console.log("COMMAND >>>> ", command);
  } catch (err) {
    return res.render('index', { output: `Error from LM Studio: ${err.message}` });
  }

  try {
    const response = await fetch('http://localhost:3000/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: "user",
        name: "terminal",
        content: { command }
      })
    });

    const data = await response.json();
    const output = data.content.stdout || data.content.stderr || data.content.error || "No output";

    res.render('index', { output });
  } catch (err) {
    res.render('index', { output: 'Error contacting MCP server: ' + err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Main Service running at http://localhost:${PORT}`);
});
