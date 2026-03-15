import GoogleLogin from "./authentication/GoogleLogin";

export default function AuthenticationPage() {
  return (
    <div className="flex w-screen min-h-screen items-center justify-center bg-gray-50">
      <GoogleLogin />
    </div>
  );
}


