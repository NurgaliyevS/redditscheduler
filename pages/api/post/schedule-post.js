import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import connectMongoDB from "@/backend/mongodb";
import ScheduledPost from "@/backend/ScheduledPostSchema";
import { differenceInMinutes } from "date-fns";
import { refreshAccessToken } from '@/utils/refreshAccessToken';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  async function makeRedditRequest(accessToken, body) {
    const response = await fetch('https://oauth.reddit.com/api/submit', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Post Content/1.0.0'
      },
      body: new URLSearchParams(body)
    });

    // If unauthorized, throw specific error
    if (response.status === 401) {
      throw new Error('UNAUTHORIZED');
    }

    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      const text = await response.text();
      throw new Error(`Non-JSON response: ${text.substring(0, 100)}...`);
    }

    return response.json();
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Get the submitted data
    const { 
      community, 
      title, 
      text, 
      scheduledDateTime, // ISO formatted date-time string
      timeZone, 
      currentClientTime, // ISO formatted current client time
      type = "text",
      isCrossPosting = false,
      flairId,
      flairText
    } = req.body;

    console.log(req.body, 'req.body');

    // Validate required fields
    if (!community || !title || !scheduledDateTime) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        received: { community, title, text, scheduledDateTime }
      });
    }
    
    // For text posts, ensure text content is provided
    if (type === 'text' && !text) {
      return res.status(400).json({ 
        message: 'Text content is required for text posts',
      });
    }

    // Check if the Reddit access token is available in the session
    if (!session.accessToken) {
      return res.status(401).json({ 
        message: 'Reddit authentication required',
        error: 'No Reddit access token found in session'
      });
    }
    
    // Check if the Reddit refresh token is available in the session
    if (!session.refreshToken) {
      return res.status(401).json({ 
        message: 'Reddit refresh token required',
        error: 'No Reddit refresh token found in session'
      });
    }
    
    // Calculate time difference in minutes
    const minutesInFuture = differenceInMinutes(scheduledDateTime, currentClientTime);
    
    // Determine if we should post immediately or schedule
    // Post immediately if scheduled time is in the past or within 2 minutes
    const shouldPostImmediately = minutesInFuture <= 2;
    
    // If we should post immediately, send it to Reddit now
    if (shouldPostImmediately) {
      console.log('Posting to Reddit immediately...');
      
      // Remove r/ prefix if it exists
      const cleanCommunity = community.replace(/^r\//, '');
      
      const postBody = {
        'sr': cleanCommunity,
        'kind': 'self',
        'title': title,
        'text': text,
        'api_type': 'json',
        'resubmit': 'true'
      };

      // Add flair if provided
      if (flairId) {
        postBody.flair_id = flairId;
        if (flairText) {
          postBody.flair_text = flairText;
        }
      }

      console.log('Preparing to post to Reddit. Post body:', postBody);
      console.log('Using access token:', session.accessToken && session.accessToken.substring(0, 8) + '...');
      let redditData;
      try {
        // First attempt with current token
        redditData = await makeRedditRequest(session.accessToken, postBody);
        console.log('Reddit API response (first attempt):', JSON.stringify(redditData));
      } catch (error) {
        if (error.message === 'UNAUTHORIZED' && session.refreshToken) {
          console.log('Token expired, attempting refresh...');
          // Try refreshing the token
          const refreshedTokens = await refreshAccessToken(session.refreshToken);
          console.log('Token refreshed. New access token:', refreshedTokens.access_token && refreshedTokens.access_token.substring(0, 8) + '...');
          // Retry with new token
          redditData = await makeRedditRequest(refreshedTokens.access_token, postBody);
          console.log('Reddit API response (after refresh):', JSON.stringify(redditData));
          // Update session token for future requests
          session.accessToken = refreshedTokens.access_token;
        } else {
          console.error('Error posting to Reddit:', error);
          throw error;
        }
      }

      if (!redditData?.json?.data) {
        console.error('Invalid response from Reddit API:', JSON.stringify(redditData));
        throw new Error('Invalid response from Reddit API');
      }

      // Connect to MongoDB
      await connectMongoDB();
      console.log('Saving post to MongoDB. Data:', {
        userId: session.user.id,
        community: cleanCommunity,
        title,
        text,
        type,
        scheduledFor: scheduledDateTime,
        userTimeZone: timeZone,
        status: 'published',
        redditPostId: redditData?.json?.data?.id || null,
        redditFullname: redditData?.json?.data?.name || null,
        redditAccessToken: session.accessToken,
        redditRefreshToken: session.refreshToken,
        postedAt: currentClientTime,
        redditPostUrl: redditData?.json?.data?.url || null,
        isCrossPosting: isCrossPosting,
        flairId,
        flairText
      });
      const postedPost = new ScheduledPost({
        userId: session.user.id,
        community: cleanCommunity,
        title,
        text,
        type,
        scheduledFor: scheduledDateTime,
        userTimeZone: timeZone,
        status: 'published',
        redditPostId: redditData?.json?.data?.id || null,
        redditFullname: redditData?.json?.data?.name || null,
        redditAccessToken: session.accessToken,
        redditRefreshToken: session.refreshToken,
        postedAt: currentClientTime,
        redditPostUrl: redditData?.json?.data?.url || null,
        isCrossPosting: isCrossPosting,
        flairId,
        flairText
      });
      const savedPost = await postedPost.save();
      console.log('Post saved to MongoDB. Saved post:', savedPost);

      return res.status(200).json({
        message: 'Post submitted to Reddit immediately',
        data: {
          id: savedPost._id,
          community,
          title,
          scheduledFor: scheduledDateTime,
          postedAt: currentClientTime,
          redditPostId: redditData?.json?.data?.id || null,
          redditFullname: redditData?.json?.data?.name || null,
          redditPostUrl: redditData?.json?.data?.url || null,
          isCrossPosting: isCrossPosting
        }
      });
      
    } 
    // Otherwise, schedule the post for later
    else {
      // Connect to MongoDB
      await connectMongoDB();

      console.log("scheduling post...")

      // Create a new scheduled post
      const cleanCommunity = community.replace(/^r\//, '');
      
      const scheduledPost = new ScheduledPost({
        userId: session.user.id,
        community: cleanCommunity,
        title,
        text,
        type,
        scheduledFor: scheduledDateTime,
        userTimeZone: timeZone, // Store the user's timezone for reference
        status: 'scheduled',
        redditAccessToken: session.accessToken,
        redditRefreshToken: session.refreshToken,
        isCrossPosting: isCrossPosting,
        flairId,
        flairText
      });
      
      const savedPost = await scheduledPost.save();

      return res.status(200).json({
        message: 'Post scheduled successfully',
        data: {
          id: savedPost._id,
          community,
          title,
          scheduledFor: scheduledDateTime,
          timeZone,
          createdAt: currentClientTime,
          isCrossPosting: isCrossPosting
        }
      });
    }

  } catch (error) {
    console.error('Error handling post request:', error);
    return res.status(500).json({ 
      message: 'Error handling post request',
      error: error.message 
    });
  }
}