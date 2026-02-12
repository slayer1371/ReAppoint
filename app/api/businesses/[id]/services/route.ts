import { prisma } from "@/lib/prisma";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

    try {
        const services = await prisma.service.findMany({
            where: { businessId: id },
            orderBy: { name: "asc" }
        })

        if (services.length === 0) {
            return Response.json([])
        }

        return Response.json(services)
    } catch (err) {
        console.error("Error fetching services:", err)
        return Response.json({ error: "Failed to fetch services" }, { status: 500 })
    }
}
