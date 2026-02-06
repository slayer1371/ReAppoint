import Verifypagecomponent from "@/components/verify-page";
import { Suspense } from "react";

export default function VerifyPage() {
  return(
    <Suspense fallback={<div>Loading verification page...</div>}>
        <Verifypagecomponent />
    </Suspense>
  )
}