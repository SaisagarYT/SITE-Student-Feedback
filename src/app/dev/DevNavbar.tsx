import React from "react";
import Image from "next/image";
import Tabs from "./Tabs";
import Link from "next/link";

export default function DevNavbar() {
  return (
    <nav className="w-full flex items-center justify-between px-6 py-3 bg-white shadow-md">
      <div className="flex items-center gap-3">
        <Image src={"../../../public/sasi_complete.png"} alt="Logo" width={40} height={40} />
        <Link href={'/dev'}><span className="font-bold text-lg">Dev Panel</span></Link>
      </div>
    </nav>
  );
}
