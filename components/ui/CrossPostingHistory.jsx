import { FiCalendar, FiCheck } from "react-icons/fi";
import { format } from "date-fns";
import { FaCalendar, FaCheckCircle, FaSpinner } from "react-icons/fa";

function CrossPostingHistory({ posts }) {
  // Filter posts where isCrossPosting is true
  const crossPosts = posts.filter((post) => post.isCrossPosting);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Cross-Posting History</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left text-sm font-medium text-gray-500">
                Original Post
              </th>
              <th className="p-3 text-left text-sm font-medium text-gray-500">
                Cross-Posted To
              </th>
              <th className="p-3 text-left text-sm font-medium text-gray-500">
                Schedule
              </th>
              <th className="p-3 text-left text-sm font-medium text-gray-500">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {crossPosts.map((post) => (
              <tr key={post._id}>
                <td className="p-3">
                  {post?.redditPostUrl ? (
                    <a href={post.redditPostUrl} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">
                      <div className="font-medium">{post.title}</div>
                      <div className="text-sm text-gray-500">
                        r/{post.community}
                      </div>
                    </a>
                  ) : (
                    <>
                      <div className="font-medium">{post.title}</div>
                      <div className="text-sm text-gray-500">
                        r/{post.community}
                      </div>
                    </>
                  )}
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                      r/{post.community}
                    </span>
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex items-center text-gray-500 text-sm gap-2">
                    <FaCalendar className="w-3 h-3" />
                    <span>
                      {format(new Date(post.scheduledFor), "MM/dd/yyyy HH:mm")}
                    </span>
                  </div>
                </td>
                <td className="p-3">
                  <span
                    className={`${
                      post.status === "published"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    } px-2 py-1 rounded-full text-xs flex items-center gap-2 w-fit`}
                  >
                    {post.status === "published" ? (
                      <FaCheckCircle className="w-3 h-3" />
                    ) : (
                      <FaSpinner className="w-3 h-3" />
                    )}
                    {post.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default CrossPostingHistory;
