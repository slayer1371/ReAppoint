import { SignupForm } from "@/components/signup-client"
import { GalleryVerticalEnd, Users } from "lucide-react"

export default function Page() {
  return (
    <div className="bg-muted min-h-svh flex flex-col p-4 md:p-8">
      <div className="shrink-0 flex items-center gap-2 self-center font-medium mb-6 md:mb-8">
        <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
          <GalleryVerticalEnd className="size-4" />
        </div>
        <span className="text-sm md:text-base">Re-Appoint</span>
      </div>
      
      <div className=" flex flex-col items-center justify-center ">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 justify-center text-sm text-muted-foreground mb-4">
            <Users className="h-4 w-4" />
            <span>Client Registration</span>
          </div>
          <SignupForm />
        </div>
      </div>
    </div>
  )
}
