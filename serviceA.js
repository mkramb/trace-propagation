"use strict";

const api = require("@opentelemetry/api");
const tracer = require("./tracer")("service-A");
const http = require("http");

/** Starts a HTTP server that receives requests on sample server port. */
function startServer(port) {
    // Creates a server
    const server = http.createServer(handleRequest);

    // Starts the server
    server.listen(port, (err) => {
        if (err) {
            throw err;
        }
        console.log(`Node HTTP listening on ${port}`);
    });
}

/** A function which handles requests and send response. */
function handleRequest(request, response) {
    const currentSpan = api.trace.getSpan(api.context.active());

    // display traceid in the terminal
    console.log(`traceid: ${currentSpan.spanContext().traceId}`);
    const span = tracer.startSpan("handleRequest", {
        kind: 1, // server
        attributes: { key: "value" },
    });

    // Annotate our span to capture metadata about the operation
    span.addEvent("invoking handleRequest");

    const body = [];
    request.on("error", (err) => console.log(err));
    request.on("data", (chunk) => body.push(chunk));
    request.on("end", () => {
        // send request to service-B
        http.get(
            {
                host: "localhost",
                port: 8081,
                path: "/",
            },
            (res) => {
                const body = [];
                res.on("data", (chunk) => body.push(chunk));
                res.on("end", () => {
                    console.log(body.toString());
                    span.end();
                    response.end("Done!");
                });
            },
        );
    });
}

startServer(8080);
