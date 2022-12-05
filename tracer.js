"use strict";

const opentelemetry = require("@opentelemetry/api");
const { CompositePropagator, W3CTraceContextPropagator } = require("@opentelemetry/core");
const { AsyncLocalStorageContextManager } = require("@opentelemetry/context-async-hooks");
const { NodeSDK } = require("@opentelemetry/sdk-node");
const { AlwaysOnSampler, BatchSpanProcessor } = require("@opentelemetry/sdk-trace-base");
const { Resource } = require("@opentelemetry/resources");
const { SemanticResourceAttributes } = require("@opentelemetry/semantic-conventions");
const { JaegerExporter } = require("@opentelemetry/exporter-jaeger");
const { HttpInstrumentation } = require("@opentelemetry/instrumentation-http");

module.exports = (serviceName) => {
    const provider = new NodeSDK({
        resource: new Resource({
            [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
        }),
        sampler: new AlwaysOnSampler(),
        spanProcessor: new BatchSpanProcessor(
            new JaegerExporter({
                host: "localhost",
                port: 6832,
            }),
        ),
        contextManager: new AsyncLocalStorageContextManager(),
        textMapPropagator: new CompositePropagator({
            propagators: [new W3CTraceContextPropagator()],
        }),
        instrumentations: [new HttpInstrumentation()],
    });

    provider.start();

    return opentelemetry.trace.getTracer("http-example");
};
