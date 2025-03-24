import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/router";
import { FaArrowRight } from "react-icons/fa";

export default function CTAButton({
  text = "Dashboard",
  dashboardPath = "/dashboard/onboarding",
  className = "btn btn-primary",
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const handleClick = () => {
    if (status === "authenticated") {
      router.push(dashboardPath);
    } else {
      signIn("reddit", { callbackUrl: "/dashboard/onboarding" });
    }
  };

  return (
    <button onClick={handleClick} className={className}>
      {text}
      <FaArrowRight className='w-3 h-3' />
    </button>
  );
}
