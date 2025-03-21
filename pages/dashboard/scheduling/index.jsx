import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { BsLink45Deg, BsImage } from "react-icons/bs";
import { RiFileTextLine } from "react-icons/ri";
import { BiPoll } from "react-icons/bi";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi";
import TimeSelector from "@/components/ui/TimeSelector";

const FORMATTING_BUTTONS = [
  { label: "B", value: "bold" },
  { label: "I", value: "italic" },
  { label: "Link", value: "link" },
  { label: "Strike", value: "strike" },
  { label: "Code", value: "code" },
  { label: "Superscript", value: "superscript" },
  { label: "Spoiler", value: "spoiler" },
  { label: "Heading", value: "heading" },
  { label: "Bulleted List", value: "bulleted-list" },
  { label: "Numbered List", value: "numbered-list" },
  { label: "Quote Block", value: "quote-block" },
];

export default function Scheduling() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status !== "loading") {
      setLoading(false);
    }
  }, [status]);

  return (
    <DashboardLayout loading={loading}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">
          Schedule Your Reddit Posts
        </h1>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="mb-4">
            <select className="select select-bordered w-full max-w-xs">
              <option disabled selected>
                Choose a community
              </option>
              <option>r/programming</option>
              <option>r/webdev</option>
              <option>r/reactjs</option>
            </select>
          </div>

          <div className="tabs mb-4">
            <button className="tab tab-bordered tab-active flex items-center gap-2">
              <RiFileTextLine /> Text
            </button>
            <button
              disabled
              className="tab tab-bordered flex items-center gap-2 opacity-50"
            >
              <BsImage /> Images & Video
            </button>
            <button
              disabled
              className="tab tab-bordered flex items-center gap-2 opacity-50"
            >
              <BsLink45Deg /> Link
            </button>
            <button
              disabled
              className="tab tab-bordered flex items-center gap-2 opacity-50"
            >
              <BiPoll /> Poll
            </button>
          </div>

          <div className="space-y-4">
            <input
              type="text"
              placeholder="Title"
              className="input input-bordered w-full"
            />

            <div className="flex flex-wrap gap-2 mb-2">
              {FORMATTING_BUTTONS.map(button => (
                <button key={button.value} className="btn btn-sm">{button.label}</button>
              ))}
            </div>

            <textarea
              className="textarea textarea-bordered w-full h-32"
              placeholder="Text"
            ></textarea>

            <div className="flex gap-8">
              <div className="flex-1">
                <p className="text-sm text-gray-500 mb-2">
                  Asia/Almaty timezone
                </p>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <button className="p-1">
                      <HiChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="font-medium">March 2025</span>
                    <button className="p-1">
                      <HiChevronRight className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center text-sm mb-2">
                    <div>Su</div>
                    <div>Mo</div>
                    <div>Tu</div>
                    <div>We</div>
                    <div>Th</div>
                    <div>Fr</div>
                    <div>Sa</div>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-sm">
                    {Array.from({ length: 35 }).map((_, i) => (
                      <button key={i} className="p-2 hover:bg-gray-100 rounded">
                        {i + 1}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex-1">
                <TimeSelector />
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <button className="btn btn-ghost">Save Draft</button>
              <button className="btn btn-primary">Schedule Post</button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
