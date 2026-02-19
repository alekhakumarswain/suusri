import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

const Profile = () => {
    const [user, setUser] = useState(null);
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            
            // Fetch live credits/profile from backend
            fetch(`http://localhost:5000/api/user-profile?email=${parsedUser.email}`)
                .then(res => res.json())
                .then(data => {
                    if (!data.error) {
                        setProfileData(data);
                    }
                    setLoading(false);
                })
                .catch(err => {
                    console.error("Fetch profile error:", err);
                    setLoading(false);
                });
        } else {
            navigate('/');
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/');
    };

    if (!user) return null;

    return (
        <div className="profile-container">
            <div className="profile-card">
                <div className="profile-header">
                    <button className="back-btn" onClick={() => navigate('/')}>
                        <i className="fas fa-arrow-left"></i>
                    </button>
                    <h2>Profile Folder</h2>
                </div>
                
                <div className="profile-content">
                    <div className="profile-image-container">
                        <img src={user.picture} alt={user.name} className="profile-pic-large" />
                    </div>
                    
                    <div className="profile-info">
                        <div className="info-group">
                            <label>Name</label>
                            <p>{user.name}</p>
                        </div>
                        <div className="info-group">
                            <label>Email</label>
                            <p>{user.email}</p>
                        </div>
                        <div className="info-group">
                            <label>Talks Remaining</label>
                            <p className="credits-text">
                                {loading ? '...' : (profileData?.credits ?? 5)} / 5
                            </p>
                        </div>
                        <div className="info-group">
                            <label>Member Since</label>
                            <p>{new Date(user.last_login).toLocaleDateString()}</p>
                        </div>
                    </div>

                    <button className="logout-btn" onClick={handleLogout}>
                        <i className="fas fa-sign-out-alt"></i> Logout
                    </button>
                </div>
            </div>
            
            <div className="profile-footer">
                <p>Protected by SuuSri Backend SSO</p>
            </div>
        </div>
    );
};

export default Profile;
