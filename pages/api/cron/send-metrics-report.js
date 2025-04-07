import connectMongoDB from "@/backend/mongodb";
import PostMetrics from "@/backend/PostMetricsSchema";
import User from "@/backend/user";
import { Resend } from "resend";
import { DateTime } from "luxon";

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Add delay between email sends to avoid rate limits
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// This endpoint will be called by Vercel Cron
export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  console.log("hey");

  try {
    // Connect to MongoDB
    await connectMongoDB();

    // Get current time in UTC
    const currentTimeUTC = DateTime.now().toUTC();

    // Determine if this is a weekly report
    const isWeeklyReport = req.query.type === "weekly";

    // Set the time range based on report type
    const timeRange = isWeeklyReport ? { days: 7 } : { hours: 6 };

    // Find metrics from the specified time range
    const metrics = await PostMetrics.find({
      createdAt: {
        $gte: currentTimeUTC.minus(timeRange).toJSDate(),
      },
    })
      .sort({ impressions: -1 })
      .limit(5);

    if (metrics.length === 0) {
      return res.status(200).json({ message: "No metrics to report" });
    }

    // Group metrics by userId
    const metricsByUser = metrics.reduce((acc, metric) => {
      if (!acc[metric.userId]) {
        acc[metric.userId] = [];
      }
      acc[metric.userId].push(metric);
      return acc;
    }, {});

    const results = [];

    // Send report to each user
    for (const [userId, userMetrics] of Object.entries(metricsByUser)) {
      try {
        // Get user email
        const user = await User.findById(userId);
        if (!user?.email) {
          console.log(`No email found for user ${userId}`);
          continue;
        }

        console.log(user, "user");
        console.log(isWeeklyReport, "isWeeklyReport");

        // Send individual email for each metric with delay between sends
        for (const metric of userMetrics) {
          try {
            const { data, error } = await earlyEmail(user, metric);
            
            if (error) {
              console.error(`Failed to send email for post ${metric.postId}:`, error);
              results.push({
                userId,
                postId: metric.postId,
                status: "error",
                error: error
              });
              continue;
            }

            results.push({
              userId,
              postId: metric.postId,
              status: "sent"
            });

            // Add 1 second delay between emails to avoid rate limits
            await delay(1000);
          } catch (error) {
            console.error(`Error sending email for post ${metric.postId}:`, error);
            results.push({
              userId,
              postId: metric.postId,
              status: "error",
              error: error.message
            });
          }
        }

      } catch (error) {
        console.error(`Error processing user ${userId}:`, error);
        results.push({
          userId,
          status: "error",
          error: error.message,
        });
      }
    }

    return res.status(200).json({
      message: `Processed ${results.length} emails`,
      results,
    });
  } catch (error) {
    console.error("Error sending metrics reports:", error);
    return res.status(500).json({
      message: "Error sending metrics reports",
      error: error.message,
    });
  }
}

async function weeklyEmail(user, metrics) {
  const { data, error } = await resend.emails.send({
    from: "RedditScheduler <updates@redditscheduler.com>",
    to: user.email,
    subject: "Your Weekly Reddit Post Performance Report",
    html: `
    `,
  });
}

async function earlyEmail(user, metric) {
  console.log("Sending email for:", {
    to: user.email,
    postId: metric.postId,
    title: metric.title
  });

  try {
    const { data, error } = await resend.emails.send({
      from: "RedditScheduler <updates@redditscheduler.com>",
      to: user.email,
      subject: `Performance Report - ${metric.title}`,
      html: `
      <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="border:1px solid #ececec;border-radius:10px;padding:24px;max-width:540px" width="100%">
        <tbody>
          <tr>
            <td style="padding-bottom:20px;text-align:center">
              <img alt="RedditScheduler" src="https://redditscheduler.com/logo.svg" style="width:100%;max-width:125px;margin:auto;text-align:center" width="220">
            </td>
          </tr>
          <tr>
            <td>
              <h1 style="color:#1f2937;text-decoration:none;font-size:22px;margin:0">
                ${metric.title}
              </h1>
              <p style="color:#6b7280;font-size:16px;line-height:20px">
                It has been a few hours since you published your post. Check out these metrics to get a snapshot of how it's doing.
              </p>
              <p style="color:#6b7280;font-size:16px;line-height:20px;margin:0">
                You can also
                <a style="color:#3b82f6;text-decoration:underline;text-decoration-color:#3b82f6" href="${metric.postUrl}">view live post</a>
                for the most up-to-date metrics.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:20px;padding-top:40px">
              <div style="border-bottom:1px solid #e5e7eb"></div>
            </td>
          </tr>
  
          <!-- Impressions -->
          <tr>
            <td>
              <p style="color:#4b5563;font-weight:800;margin:0;font-size:12px;letter-spacing:0.05em;margin-bottom:8px">IMPRESSIONS</p>
              <p style="color:#3b82f6;font-weight:900;margin:0;font-size:48px;line-height:1;font-family:Helvetica,sans-serif">
                ${metric.impressions}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:20px;padding-top:20px">
              <div style="border-bottom:1px solid #e5e7eb"></div>
            </td>
          </tr>
  
          <!-- Upvotes -->
          <tr>
            <td>
              <p style="color:#4b5563;font-weight:800;margin:0;font-size:12px;letter-spacing:0.05em;margin-bottom:8px">UPVOTES</p>
              <p style="margin:0;font-size:0px;line-height:1;font-family:Helvetica,sans-serif">
                <span style="font-size:48px;color:#3b82f6;font-weight:900">${metric.upvotes}</span>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:20px;padding-top:20px">
              <div style="border-bottom:1px solid #e5e7eb"></div>
            </td>
          </tr>
  
          <!-- Comments -->
          <tr>
            <td>
              <p style="color:#4b5563;font-weight:800;margin:0;font-size:12px;letter-spacing:0.05em;margin-bottom:8px">COMMENTS</p>
              <p style="margin:0;font-size:0px;line-height:1;font-family:Helvetica,sans-serif">
                <span style="font-size:48px;color:#3b82f6;font-weight:900">${metric.comments}</span>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:20px;padding-top:20px">
              <div style="border-bottom:1px solid #e5e7eb"></div>
            </td>
          </tr>
  
          <!-- Community -->
          <tr>
            <td>
              <p style="color:#4b5563;font-weight:800;margin:0;font-size:12px;letter-spacing:0.05em;margin-bottom:8px">POSTED IN</p>
              <p style="margin:0;font-size:0px;line-height:1;font-family:Helvetica,sans-serif">
                <span style="font-size:24px;color:#4b5563;font-weight:900">r/${metric.community}</span>
              </p>
            </td>
          </tr>
  
          <tr>
            <td style="padding-top:40px;text-align:center">
              <a href="${metric.postUrl}" style="background-color:#3b82f6;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:600;display:inline-block">View Post on Reddit</a>
            </td>
          </tr>
  
          <tr>
            <td style="padding-top:40px">
              <hr style="background-color:#ececec;border:0;height:1px;margin:0">
              <p style="color:gray;font-size:12px;text-align:center;margin-top:20px">
                © ${new Date().getFullYear()} RedditScheduler, All rights reserved.
              </p>
            </td>
          </tr>
        </tbody>
      </table>
      `,
    });

    if (error) {
      console.error("Resend API error:", error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error("Error sending early email:", error);
    return { data: null, error: error.message };
  }
}
