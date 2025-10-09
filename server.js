const express = require('express');
const cors = require('cors');
const testOpenAI = require('./api/test-openai').default;
const testGemini = require('./api/test-gemini').default;

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/test-openai', testOpenAI);
app.post('/api/test-gemini', testGemini);

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});