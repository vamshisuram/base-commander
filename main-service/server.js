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

let toolRegistry = [];

async function fetchToolRegistry() {
  try {
    const res = await fetch('http://localhost:3000/mcp/registry');
    const data = await res.json();
    toolRegistry = data.tools;
    console.log("Tool registry loaded:", toolRegistry.map(t => t.name).join(", "));
  } catch (err) {
    console.error("Failed to fetch tool registry:", err.message);
  }
}

fetchToolRegistry();

const getSystemPrompt = () => {
  const toolList = toolRegistry.map(t => `- ${t.name}: ${t.description}`).join("\n");

  const systemPrompt = `
    You are a router AI that selects the best tool and input for a given user prompt.
    Available tools and their payload schema
    ${toolList}
    ---
    Example outputs for different tools are below:
    For terminal - return this format { "tool": "terminal", "input": { "command": "..." } }
    For log -  return  { "tool": "log", "input": { "message": "..." } }
    For db - return { "tool": "db", "input": { "query": "..." } }
    ---
    The downstream service will take this data and parse to JSON. So ensure you give only that data which can be parsed.
    `;

  return systemPrompt;
}

// Handle form submission
app.post('/run', async (req, res) => {
  const prompt = req.body.prompt;
  console.log("PROMPT>>>>", prompt);
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
            content: getSystemPrompt(),

            // 'You are a router AI. Given a user prompt, decide which tool to call and with what input. Tools: terminal, db, log. Respond only with JSON: { "tool": "terminal", "input": { "command": "ls ~" } }'
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
    console.log("lmData:::", lmData);
    console.log("lmData.choices[0].message.content:::", lmData.choices[0].message.content);

    let routerResponse;
    try {
      routerResponse = JSON.parse(lmData.choices[0].message.content);
    } catch (e) {
      console.log("Parsing ERROR:::", e.message);
    }

    tool = routerResponse.tool;
    input = routerResponse.input;

  } catch (err) {
    return res.render('index', { output: `LM Studio error: ${err.message}` });
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
    const output = mcpData.content.stdout;
    res.render('index', { output });
  } catch (err) {
    return err;
    res.render('index', { output: `MCP error: ${err.message}` });
  }
});

app.listen(PORT, () => {
  console.log(`Main Service running at http://localhost:${PORT}`);
});
