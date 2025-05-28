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
  let tool, input;

  try {
    // Step 1: Ask LM Studio to determine tool + input
    const lmResponse = await fetch('http://localhost:1234/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'your-model',
        messages: [
          {
            role: 'system',
            content: 'You are a router AI. Given a user prompt, decide which tool to call and with what input. Tools: terminal, db, log. Respond only with JSON: { "tool": "terminal", "input": { "command": "ls ~" } }'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2
      })
    });

    const lmData = await lmResponse.json();
    const routerResponse = JSON.parse(lmData.choices[0].message.content);
    tool = routerResponse.tool;
    input = routerResponse.input;

  } catch (err) {
    return err;
    // return res.render('index', { output: `LM Studio error: ${err.message}` });
  }

  try {
    // Step 2: Call the routed MCP endpoint
    const body = JSON.stringify({ role: 'user', name: tool, content: input });
    console.log("BODY>>>", body);
    const mcpRes = await fetch(`http://localhost:3000/mcp/${tool}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body
    });

    const mcpData = await mcpRes.json();
    res.render('index', { output: JSON.stringify(mcpData, null, 2) });
  } catch (err) {
    return err;
    res.render('index', { output: `MCP error: ${err.message}` });
  }
});

app.listen(PORT, () => {
  console.log(`Main Service running at http://localhost:${PORT}`);
});
