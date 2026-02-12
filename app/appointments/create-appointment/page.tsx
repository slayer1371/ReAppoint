import CreateAppointment from "@/components/create-component";
import { Suspense } from "react";

export default function CreateAppointmentPage() {
    return (
        <Suspense  fallback={<div className="p-4">Loading...</div>}>
            <CreateAppointment />
        </Suspense>
    )
}
   