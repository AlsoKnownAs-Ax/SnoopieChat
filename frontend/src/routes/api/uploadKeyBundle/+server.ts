import { PkiService } from "$lib/core/api-services";
import { json, type RequestEvent, type RequestHandler } from "@sveltejs/kit"

interface PrekeyBundle {
    username: string;
    prekeyJwk: JsonWebKey;
    signature: string;
    createdAt: string;
}

export const POST = (async ({ request, locals }: RequestEvent) => {
    const prekeyBundle: PrekeyBundle = await request.json();
    const username = prekeyBundle.username;
    if(!username){
        return new Response(JSON.stringify({ error: "username missing", success: false }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    console.log("prekeyBundle: ", prekeyBundle);
    
    try {
        const { data } = await PkiService.uploadKeyBundle({
            username: username,
            signedPrekey: JSON.stringify(prekeyBundle.prekeyJwk),
            signedPrekeySignature: prekeyBundle.signature,
        })

        return new Response(JSON.stringify({ message: data, success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err: any) {
        const statusCode = err.status || 500;
        
        return new Response(JSON.stringify({ error: err.message, success: false }), {
            status: statusCode,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}) satisfies RequestHandler;