// src/functions/postFunctions.jsx

import React, { useEffect, useState } from 'react';
import AxiosInstance from '../Axios';
import '../Posts.css'

const GetPosts = ({ userID, type }) => {
  const [userPosts, setUserPosts] = useState([]);
  const [showPostBox, setShowPostBox] = useState(false); // State to control dialog visibility
  const [imageLink, setImageLink] = useState(''); // State for image link
  const [description, setDescription] = useState(''); // State for description

  // Fetch posts
  const fetchUserPosts = async (userId) => {
    try {
      const response = await AxiosInstance.post('/api/get_user_posts/', {
        userid: userId,
        type: type,
      });
      setUserPosts(response.data.posts);
    } catch (error) {
      console.error('Error fetching user posts:', error);
    }
  };

  useEffect(() => {
    if (userID) fetchUserPosts(userID);
  }, [userID]);

  const refreshPosts = () => {
    if (userID) fetchUserPosts(userID);
  };

  // Toggle dialog visibility
  const togglePostBox = () => {
    setShowPostBox(!showPostBox);
  };

  // Handle form submission
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (description.trim() !== '' && imageLink.trim() !== '') {
      try {
        // Get Post ID
        const postIDResponse = await AxiosInstance.get('api/getpostid/');
        const postID = postIDResponse.data.genString;

        // Create post
        await AxiosInstance.post('posts/', {
          postid: postID,
          postdescription: description,
          imagelink: imageLink,
        });

        // Get CreatedPost ID
        const createdPostIDResponse = await AxiosInstance.get('api/getcreatedpostid/');
        const createdPostID = createdPostIDResponse.data.genString;

        // Associate created post with the user
        await AxiosInstance.post('createdposts/', {
          ucpid: createdPostID,
          userid: userID,
          postid: postID,
        });

        // Clear form and hide dialog
        setImageLink('');
        setDescription('');
        setShowPostBox(false);
        refreshPosts(); // Refresh posts list after creating new post
      } catch (error) {
        console.error('Error creating post:', error);
      }
    }
  };

  return (
    <div className="posts-section">
      <div className="posts-header">
        {type === "all" && <h2 style={{ fontStyle: 'italic' }}>The Trellis</h2>}
        {type === "all" && (
          <div className="post-controls">
            <button className="refresh-button" onClick={refreshPosts}>&#x21bb;</button>
            <button className="create-post-button" onClick={togglePostBox}>+</button>
          </div>
        )}
      </div>

      <div className="App-posts">
        {userPosts.length > 0 ? (
          userPosts.map((post, index) => (
            <div key={index} className="post">
              <p><strong>@</strong> {post.username}</p>
              <p><strong>Image:</strong> <a href={post.imagelink} target="_blank" rel="noopener noreferrer">{post.imagelink}</a></p>
              <p><strong>Description:</strong> {post.description}</p>
              <p><strong>Posted on:</strong> {new Date(post.datetime).toLocaleString()}</p>
            </div>
          ))
        ) : (
          <p>No posts to display.</p>
        )}
      </div>

      {/* Post Creation Modal */}
      {showPostBox && (
        <div className="post-modal">
          <form onSubmit={handleCreatePost} className="post-form">
            <h3>Create New Post</h3>
            <input
              type="text"
              placeholder="Image Link"
              value={imageLink}
              onChange={(e) => setImageLink(e.target.value)}
              maxLength={250}
              required
            />
            <textarea
              placeholder="Enter description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={250}
              rows={4}
              required
            ></textarea>
            <button type="submit" className="confirm-button">Confirm</button>
            <button type="button" onClick={togglePostBox} className="cancel-button">Cancel</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default GetPosts;