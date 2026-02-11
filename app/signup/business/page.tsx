import { SignupForm } from "@/components/signup-business"
import { GalleryVerticalEnd, Building2 } from "lucide-react"

export default function Page() {
  return (
    <div className="bg-muted min-h-svh flex flex-col p-4 md:p-8">
      <div className="flex-shrink-0 flex items-center gap-2 self-center font-medium ">
        <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
          <GalleryVerticalEnd className="size-4" />
        </div>
        <span className="text-sm md:text-base">Re-Appoint</span>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center overflow-y-auto">
        <div className="w-full max-w-sm flex-shrink-0">
          <div className="flex items-center gap-2 justify-center text-sm text-muted-foreground mb-4">
            <Building2 className="h-4 w-4" />
            <span>Business Registration</span>
          </div>
          <SignupForm />
        </div>
      </div>
    </div>
  )
}
