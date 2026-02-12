import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const businesses = await prisma.businessProfile.findMany({
            select: {
                id: true,
                businessName: true,
                businessType: true,
                phone: true,
            },
            orderBy: { businessName: "asc" }
        })

        return Response.json(businesses)
    } catch (err) {
        console.error("Error fetching businesses:", err)
        return Response.json({ error: "Failed to fetch businesses" }, { status: 500 })
    }
}
