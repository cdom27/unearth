"use client";

import { useState } from "react";
import FlagIcon from "@/app/_components/icons/flag";
import ExplanationPopover from "@/app/_components/ui/tooltip/explanation-popover";
import SideMenu from "@/app/_components/ui/side-menu/side-menu";

export default function ReportIssueMenu() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <ExplanationPopover content="Report an issue in this analysis" asChild>
        <button
          type="button"
          aria-label="Report an issue"
          aria-controls="report-issue-menu"
          aria-expanded={isOpen}
          onClick={() => setIsOpen(true)}
          className="duration-250 transition-all group bg-clay-900 hover:bg-clay-600 active:bg-clay-500 p-2 rounded-full cursor-pointer"
        >
          <FlagIcon
            className="size-4 text-clay-200 group-active:text-clay-50"
            filled
          />
        </button>
      </ExplanationPopover>

      <SideMenu
        open={isOpen}
        setOpen={setIsOpen}
        id="report-issue-menu"
        size="responsive"
        alignment="right"
        closeOnOverlayClick
      >
        <div className="flex flex-col gap-3">
          <h2 className="text-2xl font-serif">Report an issue</h2>
          <p className="text-clay-200">
            Found a problem with this analysis? A report form will be available
            here soon.
          </p>
        </div>
      </SideMenu>
    </>
  );
}
