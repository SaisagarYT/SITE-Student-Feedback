import Image from "next/image";
import Link from "next/link";
import { Icon } from "@iconify/react";

type FeedbackHeaderProps = {
  activePhase: "phase1" | "phase2";
};

const FeedbackHeader = ({ activePhase }: FeedbackHeaderProps) => {
  return (
    <header data-reveal>
      <div className="border-b border-(--line) bg-(--surface) text-(--ink)">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
              <Image
                src="/sasi_logo.png"
                alt="SASI Logo"
                width={280}
                height={110}
                quality={100}
                className="h-15 w-auto object-contain sm:h-18 md:h-18 lg:h-22"
                priority
              />

            <div className="hidden items-center gap-2 rounded-full border border-(--line) bg-(--surface-soft) px-3 py-2 text-sm text-(--muted) sm:inline-flex">
              <Icon icon="material-symbols:rocket-launch-outline" className="text-lg text-(--brand)" />
              {activePhase === "phase1" ? "Phase 1 active" : "Phase 2 active"}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/admin"
              className="rounded-full border border-(--line-strong) bg-white px-3 py-2 text-xs font-semibold tracking-[0.08em] text-(--brand-deep) uppercase transition hover:border-(--brand) hover:text-(--brand) sm:text-sm"
            >
              Admin
            </Link>
            <Image
              src="/profile-avatar.svg"
              alt="Profile"
              width={52}
              height={52}
              className="h-9 w-9 rounded-full object-cover ring-2 ring-(--line) sm:h-10 sm:w-10 md:h-11 md:w-11"
              priority
            />
          </div>
        </div>
      </div>

      
    </header>
  );
};

export default FeedbackHeader;
