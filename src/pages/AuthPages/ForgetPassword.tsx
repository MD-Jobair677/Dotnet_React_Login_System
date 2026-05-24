import React from "react";
import ForgetPasswordForm from "../../components/auth/ForgetPasswordForm";
import AuthLayout from "./AuthPageLayout";

export default function ForgetPassword() {
  return (
    <AuthLayout>
      <div className="relative flex flex-col justify-center w-full h-screen lg:flex-row dark:bg-gray-900 sm:p-0">
        <div className="relative flex items-center justify-center flex-1 w-full lg:w-1/2">
          <div className="w-full max-w-md px-6 lg:px-8">
            <ForgetPasswordForm />
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}