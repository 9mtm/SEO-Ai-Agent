/**
 * Production entrypoint for cPanel Node.js (Passenger).
 *
 * cPanel's Node.js Selector uses Phusion Passenger, which expects a
 * startup file that creates an HTTP server listening on process.env.PORT.
 * This wraps Next.js in a plain Node http server so Passenger can
 * manage it like any other Node app.
 */
const next = require('next');
const http = require('http');

const port = parseInt(process.env.PORT, 10) || 3000;
const app = next({ dev: false, dir: __dirname });
const handle = app.getRequestHandler();

app.prepare()
    .then(() => {
        http.createServer((req, res) => handle(req, res))
            .listen(port, () => {
                console.log(`[seo-agent] ready on port ${port}`);
            });
    })
    .catch((err) => {
        console.error('[seo-agent] failed to start:', err);
        process.exit(1);
    });
