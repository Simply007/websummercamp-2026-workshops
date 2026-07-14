import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import express from "express";
import { z } from "zod";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const CKEDITOR_HTML = readFileSync(join(import.meta.dirname, "resource.html"), "utf-8");
const CKEDITOR_RESOURCE_URI = "ui://my-mcp-server/ckeditor-trial.html";

const app = express();
app.use(express.json());

app.use("/mcp", async (req, res) => {

    const server = new McpServer({
        name: "my-mcp-server",
        version: "1.0.0",
    });

    server.registerTool(
        "greet",
        {
            description: "A sample tool for demonstration purposes.",
            inputSchema: {
                name: z.string().describe("Name to greet"),
            },
        },
        async ({ name }) => {
            return {
                content: [
                    {
                        type: "text",
                        text: `Tool executed successfully for ${name}!`,
                    },
                ],
            };
        },
    );

    registerAppResource(
        server,
        "ckeditor-trial",
        CKEDITOR_RESOURCE_URI,
        {},
        async () => ({
            contents: [
                {
                    uri: CKEDITOR_RESOURCE_URI,
                    mimeType: RESOURCE_MIME_TYPE,
                    text: CKEDITOR_HTML,
                },
            ],
        }),
    );

    registerAppTool(
        server,
        "show_ckeditor_trial",
        {
            title: "CKEditor Free Trial",
            description:
                "Shows a CKEditor overview card with a button to start a free trial. " +
                "Use when the user asks about CKEditor, rich text editors, or trying CKEditor.",
            inputSchema: {},
            _meta: {
                ui: { resourceUri: CKEDITOR_RESOURCE_URI },
            },
        },
        async () => ({
            content: [
                {
                    type: "text",
                    text: "CKEditor trial card is displayed. Sign-up supports Google, GitHub, or email & password.",
                },
            ],
        }),
    );

    const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined, // stateless: new server+transport per request
        enableJsonResponse: true,
    });

    res.on("close", () => {
        console.log("Connection closed by the client.");
        transport.close();
        server.close();
    });

    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
});


app.listen(7777, () => {
    console.log("MCP server is running on http://localhost:7777/mcp");
})
