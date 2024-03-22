const http = require('http');
const https = require('https');
const url = require('url');

const PORT = process.env.PORT || 3002;

const server = http.createServer((req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;
    const query = parsedUrl.query;

    if (path === '/wiki/search') {
        if (!query || !query.q) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'Search query parameter (q) is required' }));
        }

        const searchTerm = query.q;
        const offset = parseInt(query.offset) || 0;
        const limit = parseInt(query.limit) || 10;

        // Fetch data from Wikipedia API
        fetchWikipediaSearchResults(searchTerm, offset, limit)
            .then(data => {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(data));
            })
            .catch(error => {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Internal Server Error' }));
            });
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not Found' }));
    }
});

function fetchWikipediaSearchResults(searchTerm, offset, limit) {
    const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&list=search&srsearch=${searchTerm}&sroffset=${offset}&srlimit=${limit}`;

    return new Promise((resolve, reject) => {
        https.get(apiUrl, response => {
            let data = '';

            response.on('data', chunk => {
                data += chunk;
            });

            response.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve(jsonData.query.search);
                } catch (error) {
                    reject(error);
                }
            });
        }).on('error', error => {
            reject(error);
        });
    });
}

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
