/**
 * @NApiVersion 2.1
 * @NScriptType Portlet
 */
define(['N/https', 'N/url'], (https, url) => {
    const render = (params) => {
        const portlet = params.portlet;
        portlet.title = 'ChatGPT Bot';

        // Add a simple HTML form for user input
        portlet.html = `
            <div id="chatbot-container" style="padding: 10px;">
                <textarea id="chat-input" style="width: 90%; height: 50px;" placeholder="Type your question..."></textarea>
                <button id="submit-btn" style="margin-top: 10px;">Submit</button>
                <div id="chat-response" style="margin-top: 20px; border-top: 1px solid #ccc; padding-top: 10px;"></div>
            </div>
            <script>
                document.getElementById('submit-btn').addEventListener('click', () => {
                    const prompt = document.getElementById('chat-input').value;
                    const serverUrl = '${url.resolveScript({ scriptId: 'customscript_node_api_endpoint', deploymentId: 'customdeploy_node_api' })}';

                    if (prompt) {
                        fetch(serverUrl, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ prompt })
                        })
                        .then(response => response.json())
                        .then(data => {
                            document.getElementById('chat-response').innerHTML = '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
                        })
                        .catch(err => {
                            document.getElementById('chat-response').innerHTML = '<pre>Error: ' + err.message + '</pre>';
                        });
                    }
                });
            </script>
        `;
    };

    return { render };
});
