const express = require('express');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const bodyParser = require('body-parser');
const Client = require('ssh2-sftp-client');
const { Configuration, OpenAIApi } = require('openai');

const app = express();
const PORT = 3000;

// Configure OpenAI API
const openai = new OpenAIApi(
    new Configuration({
        apiKey: 'your-openai-api-key', // Replace with your OpenAI API key
    })
);

// SFTP Configuration
const SFTP_CONFIG = {
    host: 'eu-central-1.sftpcloud.io',
    port: '22',
    username: 'ad9082cdfd094e06bf3f9fc4d917ac31',
    password: '6PP9ElJR5e4VpG8GjIJ9BDU42aRD0UM4',
};

// Fetch data from SFTP
const getDataFromSFTP = async (fileName) => {
    const sftp = new Client();
    try {
        await sftp.connect(SFTP_CONFIG);
        const localPath = path.join(__dirname, fileName);
        await sftp.get(`/path/to/${fileName}`, localPath);
        return new Promise((resolve, reject) => {
            const results = [];
            fs.createReadStream(localPath)
                .pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', () => resolve(results))
                .on('error', (err) => reject(err));
        });
    } catch (err) {
        throw new Error(`SFTP Error: ${err.message}`);
    } finally {
        sftp.end();
    }
};

// API endpoint for chatbot
app.post('/chat', async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }

    try {
        // Fetch data from SFTP
        const csvData = await getDataFromSFTP('exported_data.csv');

        // Summarize CSV data for LLM input
        const summarizedData = csvData
            .slice(0, 10) // Limit rows to prevent token overflow
            .map((row) => JSON.stringify(row))
            .join('\n');

        // Build a custom LLM prompt
        const llmPrompt = `
            You are a chatbot with access to the following data:
            ${summarizedData}
            Based on this data, answer the following user query:
            "${prompt}"
        `;

        // Generate response using OpenAI GPT API
        const gptResponse = await openai.createChatCompletion({
            model: 'gpt-4', // Use 'gpt-4' or 'gpt-3.5-turbo'
            messages: [
                { role: 'system', content: 'You are a helpful assistant with access to CSV data.' },
                { role: 'user', content: llmPrompt },
            ],
        });

        // Extract response text
        const responseText = gptResponse.data.choices[0].message.content;

        res.json({ prompt, response: responseText });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
