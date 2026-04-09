import React from "react";
import DevNavbar from "./DevNavbar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      {/* <DevNavbar /> */}
      <main>{children}</main>
    </div>
  );
}
