import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import withAuth from "@/components/withAuth";
import PostTypeTabs from "@/components/scheduling/PostTypeTabs";
import FormattingToolbar from "@/components/scheduling/FormattingToolbar";
import SubredditSelector from "@/components/scheduling/SubredditSelector";
import { format, parse, setHours, setMinutes, add, sub } from "date-fns";
import Post from "@/components/ui/Post";
import { toast } from "react-toastify";
import { showNotification } from "@/components/cross-posting/ToastNotifications";
import { useRouter } from "next/router";
import { useSidebar } from "@/context/SidebarContext";

function Scheduling() {
  const { data: session, status } = useSession();
  const [subreddits, setSubreddits] = useState([]);
  const [subredditsLoading, setSubredditsLoading] = useState(false);
  const [subredditsError, setSubredditsError] = useState(null);
  const [formData, setFormData] = useState({
    community: "",
    title: "",
    text: "",
    selectedDate: format(new Date(), "yyyy-MM-dd"),
    selectedTime: format(new Date(), "HH:mm"),
    type: "text",
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  const [userTimezone, setUserTimezone] = useState("");
  const [initialized, setInitialized] = useState(false);
  const [isLoadingForm, setIsLoadingForm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const router = useRouter();
  const { refreshData } = useSidebar();
  
  if (status !== "loading" && !initialized) {
    setInitialized(true);

    // Get user's timezone
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setUserTimezone(timezone);

    // Only fetch subreddits if we have a session
    if (session && subreddits.length === 0 && !subredditsLoading) {
      fetchUserSubreddits();
    }
  }

  async function fetchUserSubreddits() {
    try {
      setSubredditsLoading(true);
      setSubredditsError(null);

      const response = await fetch("/api/reddit/subreddits");

      if (!response.ok) {
        throw new Error(`Failed to fetch subreddits: ${response.status}`);
      }

      const data = await response.json();
      setSubreddits(data.subreddits || []);
    } catch (error) {
      console.error("Error fetching subreddits:", error);
      setSubredditsError(error.message);
    } finally {
      setSubredditsLoading(false);
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFormatting = (formatType) => {
    const textarea = document.querySelector("textarea");
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = formData.text.substring(start, end);

    let formattedText = "";
    let newCursorPosition = end;

    if (formatType === "bold") {
      formattedText =
        formData.text.substring(0, start) +
        `**${selectedText}**` +
        formData.text.substring(end);
      newCursorPosition = selectedText.length ? end + 4 : start + 2;
    } else if (formatType === "italic") {
      formattedText =
        formData.text.substring(0, start) +
        `*${selectedText}*` +
        formData.text.substring(end);
      newCursorPosition = selectedText.length ? end + 2 : start + 1;
    } else if (formatType === "link") {
      if (selectedText) {
        formattedText =
          formData.text.substring(0, start) +
          `[${selectedText}](url)` +
          formData.text.substring(end);
        newCursorPosition = start + selectedText.length + 2;
      } else {
        formattedText =
          formData.text.substring(0, start) +
          "[Link text](url)" +
          formData.text.substring(end);
        newCursorPosition = start + 1;
      }
    }

    setFormData((prev) => ({
      ...prev,
      text: formattedText,
    }));
  };

  const handleDateTimeChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const checkPostAvailability = async () => {
    const accessResponse = await fetch('/api/user/check-access');
    if (!accessResponse.ok) {
      throw new Error('Failed to check post availability');
    }
    const accessData = await accessResponse.json();
    
    if (accessData.post_available <= 0) {
      router.push('/#pricing');
      throw new Error('No posts available. \nPlease upgrade your plan.');
    }

    return true;
  };

  const updatePostAvailability = async () => {
    try {
      await fetch('/api/user/update-post-available', {
        method: 'POST',
      });
      refreshData();
    } catch (updateError) {
      console.error('Error updating post availability:', updateError);
    }
  };

  const schedulePost = async () => {
    if (!formData.community || !formData.title || !formData.selectedDate || !formData.selectedTime) {
      showNotification("error", {
        successful: [],
        failed: [{ subreddit: "All", reason: "Please fill in all required fields" }],
        total: 1,
      }, toast);
      return;
    }

    setIsLoadingForm(true);
    try {
      // Check post availability first
      await checkPostAvailability();

      // Parse the date string
      const scheduledDate = parse(formData.selectedDate, "yyyy-MM-dd", new Date());

      // Parse the time string (now in 24-hour format)
      const [hours, minutes] = formData.selectedTime.split(":");

      // Set hours and minutes on the scheduledDate
      let scheduledDateTime = setHours(scheduledDate, parseInt(hours, 10));
      scheduledDateTime = setMinutes(scheduledDateTime, parseInt(minutes, 10));

      // Format as ISO string for API
      const scheduledDateTimeISO = format(
        scheduledDateTime,
        "yyyy-MM-dd'T'HH:mm:ssxxx"
      );
      const currentTimeISO = format(new Date(), "yyyy-MM-dd'T'HH:mm:ssxxx");

      const response = await fetch("/api/post/schedule-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          community: formData.community,
          title: formData.title,
          text: formData.text.replace(/\n/g, "\n\n"),
          scheduledDateTime: scheduledDateTimeISO,
          timeZone: userTimezone,
          currentClientTime: currentTimeISO,
          type: formData.type,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to schedule post");
      }

      setFormData({
        community: "",
        title: "",
        text: "",
        selectedDate: format(new Date(), "yyyy-MM-dd"),
        selectedTime: format(new Date(), "HH:mm"),
        type: "text",
      });

      const data = await response.json();
      showNotification("success", {
        successful: [{ subreddit: formData.community }],
        failed: [],
        total: 1,
      }, toast);
      
      setRefreshTrigger((prev) => prev + 1);
      updatePostAvailability();
    } catch (error) {
      console.error("Error scheduling post:", error);
      showNotification("error", {
        successful: [],
        failed: [{ subreddit: formData.community, reason: error.message || "Error scheduling post. Please try again." }],
        total: 1,
      }, toast);
    } finally {
      setIsLoadingForm(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-10 min-h-screen">
        <div className="max-w-4xl">
          <h1 className="text-2xl md:text-3xl font-bold mb-6">
            Schedule Reddit Posts
          </h1>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <SubredditSelector
              subreddits={subreddits}
              subredditsLoading={subredditsLoading}
              subredditsError={subredditsError}
              selectedCommunity={formData.community}
              onCommunityChange={handleInputChange}
              onRetry={fetchUserSubreddits}
            />

            <PostTypeTabs
              type={formData.type}
              onTypeChange={(type) =>
                setFormData((prev) => ({ ...prev, type }))
              }
            />

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="input input-bordered w-full"
              />

              <FormattingToolbar onFormat={handleFormatting} />

              <textarea
                className="textarea textarea-bordered w-full min-h-32"
                placeholder="Text"
                name="text"
                value={formData.text}
                onChange={(e) => {
                  // Reset height to auto
                  e.target.style.height = "auto";

                  // Set height based on scroll height
                  e.target.style.height = `${e.target.scrollHeight}px`;

                  handleInputChange(e);
                }}
              ></textarea>

              <div className="flex gap-4 mt-4">
                <input
                  type="date"
                  name="selectedDate"
                  value={formData.selectedDate}
                  onChange={handleDateTimeChange}
                  min={format(new Date(), "yyyy-MM-dd")}
                  className="input input-bordered"
                />

                <input
                  type="time"
                  name="selectedTime"
                  value={formData.selectedTime}
                  onChange={handleDateTimeChange}
                  className="input input-bordered"
                  format="HH:mm"
                />
              </div>

              <div className="flex justify-end mt-6">
                <button
                  className="btn btn-primary"
                  disabled={
                    !formData.selectedDate ||
                    !formData.selectedTime ||
                    !formData.title ||
                    !formData.community ||
                    isLoadingForm
                  }
                  onClick={schedulePost}
                >
                  {isLoadingForm ? "Scheduling..." : "Schedule Post"}
                </button>
              </div>
            </div>
          </div>
        </div>
        <Post refreshTrigger={refreshTrigger} />
      </div>
    </DashboardLayout>
  );
}

export default withAuth(Scheduling);
