import { useEffect, useState } from "react"

export default function ProfilePage() {
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        const fetchProfile = async () => {
        try {
        const res = await fetch("/api/profile", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        })

        if (!res.ok) {
            setError("Failed to fetch profile")
        }
    }catch (err ) {
        console.error("Error fetching profile:", err)
        setError(err.message)
    }
    }
    fetchProfile();
    }, [])
    
    return (
        <div></div>
    )
}