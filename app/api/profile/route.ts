import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

export default function GET(req : Request) {
    const session = getServerSession(authOptions);

    if(!session) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
    }

    
}