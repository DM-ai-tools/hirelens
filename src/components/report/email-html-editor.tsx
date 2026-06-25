"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Bold, Italic, Link2, List, Underline } from "lucide-react";

export function EmailHtmlEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value;
    }
  }, [value]);

  function exec(cmd: string, val?: string) {
    document.execCommand(cmd, false, val);
    if (ref.current) onChange(ref.current.innerHTML);
  }

  function addLink() {
    const url = window.prompt("Link URL (use {{assessment_link}} for assessment):");
    if (url) exec("createLink", url);
  }

  return (
    <div className="rounded-lg border border-[#E5E9F0] dark:border-white/10">
      <div className="flex flex-wrap gap-1 border-b border-[#E5E9F0] bg-[#F6F8FB] p-2 dark:border-white/10 dark:bg-white/5">
        <Button type="button" variant="ghost" size="icon-sm" onClick={() => exec("bold")} title="Bold">
          <Bold className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon-sm" onClick={() => exec("italic")} title="Italic">
          <Italic className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon-sm" onClick={() => exec("underline")} title="Underline">
          <Underline className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon-sm" onClick={() => exec("insertUnorderedList")} title="List">
          <List className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon-sm" onClick={addLink} title="Link">
          <Link2 className="h-4 w-4" />
        </Button>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        className="min-h-[200px] max-h-[280px] overflow-y-auto p-3 text-sm outline-none focus:ring-2 focus:ring-[#C8202A]/20"
        onInput={() => ref.current && onChange(ref.current.innerHTML)}
      />
    </div>
  );
}
