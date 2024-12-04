import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom'; // Import useParams
import AxiosInstance from '../Axios';
import '../App.css';
import GetSidebar from '../functions/display';
import '../Communities.css';

function Communities() {
  const { communitykey } = useParams(); // Extract community key from the route
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchKey, setSearchKey] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [userCommunities, setUserCommunities] = useState([]);
  const [currentUserID, setCurrentUserID] = useState(null);
  const [communityStatus, setCommunityStatus] = useState('');
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [showSearchTab, setShowSearchTab] = useState(true); // true for search by name, false for search by communitykey
  const [newCommunityName, setNewCommunityName] = useState('');
  const [newCommunityDescription, setNewCommunityDescription] = useState(''); // Optional description
  const [currentCommunity, setCurrentCommunity] = useState(null); // Stores current community details

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser) {
      fetchCurrentUserID();
    }
  }, []);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const fetchCurrentUserID = async () => {
    try {
      const currentUsername = JSON.parse(localStorage.getItem('user')).username;
      const response = await AxiosInstance.get(`users/?username=${currentUsername}`);
      if (response.data.length > 0) {
        setCurrentUserID(response.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching current user ID:', error);
    }
  };

  const fetchCommunities = async (userid) => {
    try {
      const response = await AxiosInstance.get(`/api/communities?user=${userid}`);
      setUserCommunities(response.data);
    } catch (error) {
      console.error('Error fetching communities:', error);
    }
  };

  const fetchCommunityDetails = async (key) => {
    try {
      const response = await AxiosInstance.get(`/api/community-details/${key}`);
      setCurrentCommunity(response.data);
    } catch (error) {
      console.error('Error fetching community details:', error);
    }
  };

  const searchCommunities = async () => {
    try {
      const endpoint = showSearchTab
        ? `/api/search-communities-name?name=${searchTerm}`
        : `/api/search-communities-key?key=${searchKey}`;
      const response = await AxiosInstance.get(endpoint);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error searching communities:', error);
    }
  };

  useEffect(() => {
    if (currentUserID) {
      fetchCommunities(currentUserID);
    }
  }, [currentUserID]);

  useEffect(() => {
    if (communitykey && communitykey !== 'overview') {
      fetchCommunityDetails(communitykey);
    } else {
      setCurrentCommunity(null); // Reset if on overview
    }
  }, [communitykey]);

  const leaveCommunity = async (community) => {
    try {
      await AxiosInstance.post('/api/leave-community', {
        user: currentUserID,
        community: community.id,
      });
      setCommunityStatus(`You have left ${community.name}.`);
      fetchCommunities(currentUserID);
    } catch (error) {
      console.error('Error leaving community:', error);
    }
  };

  const handleAddCommunity = () => {
    setShowAddPopup(true);
  };

  const handleCancel = () => {
    setShowAddPopup(false);
    setNewCommunityName('');
    setNewCommunityDescription('');
    setSearchTerm('');
    setSearchKey('');
    setSearchResults([]);
  };

  const handleCreateCommunity = async (e) => {
    e.preventDefault();
    try {
      const newCommunity = {
        name: newCommunityName,
        description: newCommunityDescription,
        user: currentUserID,
      };

      const response = await AxiosInstance.post('/api/create-community', newCommunity);
      const createdCommunity = response.data;

      setUserCommunities([...userCommunities, createdCommunity]);
      setShowAddPopup(false);
      navigate(`/communities/${createdCommunity.key}`); // Use the community key
    } catch (error) {
      console.error('Error creating community:', error);
    }
  };

  const handleCommunityClick = (communityKey) => {
    navigate(`/communities/${encodeURIComponent(communityKey)}`);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1 className="App-title">Grapevine</h1>
      </header>

      <div className="App-content">
        <GetSidebar />

        <main className="App-main">
          {communitykey === 'overview' || !communitykey ? (
            <>
              {/* Overview Content */}
              <div className="search-container">
                <input
                  type="text"
                  placeholder="Search"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="search-input"
                />
              </div>

              <div className="Communities-body">
                <h2>Communities</h2>
                {userCommunities.length > 0 ? (
                  userCommunities.map((community) => (
                    <div key={community.id}>
                      <h3>
                        <button
                          onClick={() => handleCommunityClick(community.key)}
                          className="community-link"
                        >
                          {community.name}
                        </button>
                      </h3>
                      <button onClick={() => leaveCommunity(community)}>Leave</button>
                    </div>
                  ))
                ) : (
                  <p>No communities found.</p>
                )}
              </div>
            </>
          ) : currentCommunity ? (
            <>
              {/* Individual Community Content */}
              <h2>{currentCommunity.name}</h2>
              <p>{currentCommunity.description}</p>
              <p>Privacy: {currentCommunity.privacy}</p>
              {/* Additional community-specific content */}
            </>
          ) : (
            <p>Loading community...</p>
          )}
        </main>

        <aside className="Comm-sidebar">
          <h2>Your Communities</h2>
          <button onClick={handleAddCommunity} className="add-community-button">
            Add Community
          </button>
          <ul className="community-list">
            {userCommunities.map((community) => (
              <li key={community.id}>
                <button
                  onClick={() => handleCommunityClick(community.key)}
                  className="community-link"
                >
                  {community.name}
                </button>
              </li>
            ))}
          </ul>
        </aside>
      </div>

      {showAddPopup && (
        <div className="modal-overlay">
          <div className="modal-window">
            <div className="tabs">
              <button onClick={() => setShowSearchTab(true)} className={showSearchTab ? 'active' : ''}>
                Search Communities
              </button>
              <button onClick={() => setShowSearchTab(false)} className={!showSearchTab ? 'active' : ''}>
                Create Community
              </button>
            </div>

            {showSearchTab ? (
              <div className="search-tab">
                <input
                  type="text"
                  placeholder="Search by Name"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Search by Community Key"
                  value={searchKey}
                  onChange={(e) => setSearchKey(e.target.value)}
                />
                <button onClick={searchCommunities}>Search</button>
                <button onClick={handleCancel} className="cancel-button">
                  Cancel
                </button>
                <ul>
                  {searchResults.map((result) => (
                    <li key={result.id}>
                      <p>{result.name}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <form onSubmit={handleCreateCommunity} className="post-form">
                <h3>Create New Community</h3>
                <input
                  type="text"
                  placeholder="Community Name"
                  value={newCommunityName}
                  onChange={(e) => setNewCommunityName(e.target.value)}
                  maxLength={50}
                  required
                />
                <textarea
                  placeholder="Community Description (optional)"
                  value={newCommunityDescription}
                  onChange={(e) => setNewCommunityDescription(e.target.value)}
                  maxLength={250}
                  rows={4}
                ></textarea>
                <button type="submit" className="confirm-button">
                  Create
                </button>
                <button type="button" onClick={handleCancel} className="cancel-button">
                  Cancel
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Communities;
