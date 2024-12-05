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
  const [searchResults, setSearchResults] = useState([]);
  const [userCommunities, setUserCommunities] = useState([]);
  const [currentUserID, setCurrentUserID] = useState(null);
  const [communityStatus, setCommunityStatus] = useState('');
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [showSearchTab, setShowSearchTab] = useState(true); // true for search by name, false for search by communitykey
  const [newCommunityName, setNewCommunityName] = useState('');
  const [newCommunityDescription, setNewCommunityDescription] = useState(''); // Optional description
  const [currentCommunity, setCurrentCommunity] = useState(null); // Stores current community details
  const [searchError, setSearchError] = useState(''); // Error message for search term
  const [noSearchResults, setNoSearchResults] = useState(false); // Track if no search results were found

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser) {
      fetchCurrentUserID();
    }
  }, []);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setSearchError(''); // Clear error on input change
    setNoSearchResults(false); // Reset no search results message
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
      const response = await AxiosInstance.post(`/api/get_communities/`, { userid });
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
    if (searchTerm.length < 2) {
      setSearchError('Search term must be at least 2 characters.');
      return;
    }

    try {
      const response = await AxiosInstance.post('api/search_communities/', { searchTerm });
      const results = response.data;
      setSearchResults(results);
      setSearchError(''); // Clear error if search is successful
      setNoSearchResults(results.length === 0); // Set noSearchResults if no communities are found
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
    setSearchError('');
    setSearchResults([]);
    setNoSearchResults(false); // Reset no search results message
  };

  const handleCreateCommunity = async (e) => {
    e.preventDefault();
    try {
      // Call APIs to get IDs
      const communityIDResponse = await AxiosInstance.get('/api/getcommunitiesid/');
      const communityID = communityIDResponse.data.genString;

      const memberIDResponse = await AxiosInstance.get('/api/getmemberid/');
      const memberID = memberIDResponse.data.genString;

      const communityKeyResponse = await AxiosInstance.get('/api/getcommkey/');
      const communityKey = communityKeyResponse.data.commKey;

      // Prepare newCommunity and newMember data
      const newCommunity = {
        name: newCommunityName,
        description: newCommunityDescription,
        user: currentUserID,
        communityid: communityID,
        communitykey: communityKey,
      };

      const newMember = {
        userid: currentUserID,
        communityid: communityID,
        memberid: memberID,
      };

      // Create community in the database
      await AxiosInstance.post('api/create_community/', newCommunity);

      // Add the current user as a member
      await AxiosInstance.post('api/add_member/', newMember);

      // Update the state
      setUserCommunities([...userCommunities, { ...newCommunity, key: communityKey }]);
      setShowAddPopup(false); // Close the modal after successful creation
    } catch (error) {
      console.error('Error creating community:', error);
    }
  };

  const handleCommunityClick = (communityKey) => {
    setShowAddPopup(false); // Close the modal
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
                <h2>Community Overview</h2>
                {userCommunities.length > 0 ? (
                  userCommunities.map((community) => (
                    <div key={community.communityid}>
                      <h3>
                        <button
                          onClick={() => handleCommunityClick(community.communitykey)}
                          className="community-link"
                        >
                          {community.communityname}
                        </button>
                      </h3>
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
              <h2>{currentCommunity.communityname}</h2>
              <p>{currentCommunity.communitydescription}</p>
              <p>Creator: {currentCommunity.ownerid}</p>
            </>
          ) : (
            <p>Loading community...</p>
          )}
        </main>

        <aside className="Comm-sidebar">
          <h2>Your Communities</h2>
          <button onClick={handleAddCommunity} className="add-community-button">
            Search/Create Community
          </button>
          <ul className="community-list">
            {userCommunities.map((community) => (
              <li key={community.communityid}>
                <button
                  onClick={() => handleCommunityClick(community.communitykey)}
                  className="community-link"
                >
                  {community.communityname}
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
                  placeholder="Search by Name or Community Key"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button onClick={searchCommunities} className="confirm-button">
                  Search
                </button>
                <button onClick={handleCancel} className="cancel-button">
                  Cancel
                </button>
                {searchError && <p className="error-message">{searchError}</p>}
                {noSearchResults && <p className="error-message">No communities found.</p>}
                <ul>
                  {searchResults.map((result) => (
                    <li key={result.communityid}>
                      <button
                        onClick={() => handleCommunityClick(result.communitykey)}
                        className="community-link"
                      >
                        {result.communityname}
                      </button>
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
