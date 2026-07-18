// @ts-ignore
import server from "./server.cjs";
const app = (server as any).default || server;
export default app;
