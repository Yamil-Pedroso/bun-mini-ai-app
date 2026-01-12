import { groqService } from "./services/groq";
import { cerebrasService } from "./services/cerebras";
import type { AIService, ChatMessage } from "./types";

const services: AIService[] = [groqService, cerebrasService];
let currentServiceIndex = 0;

const getNextService = (): AIService => {
  const service = services[currentServiceIndex];
  if (!service) {
    throw new Error("No services available");
  }
  currentServiceIndex = (currentServiceIndex + 1) % services.length;
  return service;
};

const server = Bun.serve({
  port: process.env.PORT ?? 3000,
  async fetch(req) {
    const pathName = new URL(req.url);

    if (req.method === "POST" && pathName.pathname === "/chat") {
      const { messages } = (await req.json()) as { messages: ChatMessage[] };
      const service = getNextService();

      console.log(`Using service: ${service.name} for chat request.`);

      const stream = await service.chat(messages);

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }
    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Server running at http://localhost:${server.port}/`);
