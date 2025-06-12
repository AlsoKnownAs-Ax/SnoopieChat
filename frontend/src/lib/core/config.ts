import { z } from "zod";
import { env } from '$env/dynamic/public';


// Defines environment variables that are available to the client
export const PublicConfigSchema = z.object({
    PUBLIC_API_HOST: z.string().url().default('http://localhost:8080'),
});

export type PublicConfigSchema = z.infer<typeof PublicConfigSchema>;

export const config = PublicConfigSchema.parse(env);