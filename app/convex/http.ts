import { httpRouter } from "convex/server";
import { auth } from "./auth";

const http = httpRouter();

// Convex Auth wires the auth routes (JWT discovery, OAuth callbacks).
auth.addHttpRoutes(http);

export default http;
