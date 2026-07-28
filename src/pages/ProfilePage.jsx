import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Heart,
  Bookmark,
  LogOut,
  Gamepad2,
  Clock3,
  CheckCircle2,
  Pencil,
  User,
  ArrowLeft,
} from "lucide-react";

import Header from "../components/Layout/Header";
import Carousel from "../components/Common/Carousel";
import GameCard from "../components/Explore/GameCard";
import SignOutModal from "../components/Common/SignOutModal";
import EditProfileModal from "../components/Common/EditProfileModal";

import { useAuth } from "../context/AuthContext";
import {
  getWishlist,
  getLibrary,
  getLibraryStatusCount,
} from "../utils/storage";

import "../styles/profile.css";

function ProfilePage() {
  const { user, logout, updateUserProfile } = useAuth();
  const navigate = useNavigate();

  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [searchInput, setSearchInput] = useState("");

  if (!user) {
    return null;
  }

  const wishlist = getWishlist();
  const library = getLibrary();
  const statusCounts = getLibraryStatusCount();

  const previewGames = library.slice(0, 4);

  return (
    <>
      <Header searchInput={searchInput} updateSearchInput={setSearchInput} />

      <main className="profile-page">
        <div className="container">
          {/* ==================================================
              PROFILE HERO
          ================================================== */}

          <section className="profile-hero">
            <div className="profile-hero-content">
              <div className="profile-avatar-container">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || "Profile"}
                    className="profile-avatar"
                  />
                ) : (
                  <div className="profile-avatar profile-avatar-fallback">
                    <User size={32} />
                  </div>
                )}

                <button
                  type="button"
                  className="profile-avatar-edit"
                  aria-label="Change profile picture"
                  title="Change profile picture"
                  onClick={() => setShowEditProfileModal(true)}
                >
                  <Pencil size={15} />
                </button>
              </div>

              <div className="profile-hero-info">
                <div className="profile-eyebrow">FRACTURE PROFILE</div>

                <h1>{user.displayName || "FRACTURE User"}</h1>

                {user.username && (
                  <p className="profile-username">@{user.username}</p>
                )}

                <p>{user.email || "No email available"}</p>
              </div>

              <button
                type="button"
                className="profile-edit-button"
                onClick={() => setShowEditProfileModal(true)}
              >
                <Pencil size={16} />
                Edit Profile
              </button>
            </div>
          </section>

          {/* ==================================================
              ACCOUNT DETAILS
          ================================================== */}

          <section className="profile-section">
            <div className="profile-section-heading">
              <div>
                <div className="profile-card-eyebrow">ACCOUNT DETAILS</div>

                <h2>Account Information</h2>
              </div>
            </div>

            <div className="profile-account-details">
              <div className="profile-info-row">
                <span>Display Name</span>

                <strong>{user.displayName || "FRACTURE User"}</strong>
              </div>

              <div className="profile-info-row">
                <span>Email</span>

                <strong>{user.email || "Not available"}</strong>
              </div>

              <div className="profile-info-row">
                <span>Account ID</span>

                <strong className="profile-id">
                  {user.uid.slice(0, 12)}...
                </strong>
              </div>

              <div className="profile-info-row">
                <span>Member Since</span>

                <strong>
                  {user.metadata?.creationTime
                    ? new Date(user.metadata.creationTime).toLocaleDateString(
                        "en-US",
                        {
                          month: "long",
                          year: "numeric",
                        },
                      )
                    : "July 2026"}
                </strong>
              </div>
            </div>
          </section>

          {/* ==================================================
              YOUR PROGRESS
          ================================================== */}

          <section className="profile-section">
            <div className="profile-section-heading">
              <div>
                <div className="profile-card-eyebrow">YOUR PROGRESS</div>

                <h2>Gaming Status</h2>
              </div>
            </div>

            <div className="profile-progress-grid">
              <div className="profile-progress-item">
                <div className="profile-progress-icon">
                  <Gamepad2 size={20} />
                </div>

                <div className="profile-progress-info">
                  <span>Backlog</span>

                  <strong>{statusCounts.backlog}</strong>
                </div>
              </div>

              <div className="profile-progress-item">
                <div className="profile-progress-icon">
                  <Clock3 size={20} />
                </div>

                <div className="profile-progress-info">
                  <span>Playing</span>

                  <strong>{statusCounts.playing}</strong>
                </div>
              </div>

              <div className="profile-progress-item">
                <div className="profile-progress-icon">
                  <CheckCircle2 size={20} />
                </div>

                <div className="profile-progress-info">
                  <span>Completed</span>

                  <strong>{statusCounts.completed}</strong>
                </div>
              </div>
            </div>
          </section>

          {/* ==================================================
              YOUR COLLECTION
          ================================================== */}

          <section className="profile-section profile-collection-section">
            <div className="profile-section-heading profile-collection-heading">
              <div>
                <div className="profile-card-eyebrow">YOUR COLLECTION</div>

                <h2>Your Games</h2>
              </div>
            </div>

            {/* COLLECTION QUICK LINKS */}

            <div className="profile-collection-links">
              <Link to="/wishlist" className="profile-collection-link">
                <div className="profile-collection-link-icon">
                  <Heart size={19} />
                </div>

                <div>
                  <strong>Wishlist</strong>

                  <span>
                    {wishlist.length} {wishlist.length === 1 ? "Game" : "Games"}
                  </span>
                </div>
              </Link>

              <Link to="/library" className="profile-collection-link">
                <div className="profile-collection-link-icon">
                  <Bookmark size={19} />
                </div>

                <div>
                  <strong>Library</strong>

                  <span>
                    {library.length} {library.length === 1 ? "Game" : "Games"}
                  </span>
                </div>
              </Link>
            </div>

            {/* ==================================================
                LIBRARY GAME CAROUSEL
            ================================================== */}

            {previewGames.length > 0 ? (
              <div className="profile-collection-carousel">
                <Carousel
                  title="Your Library"
                  items={previewGames}
                  itemWidth={230}
                  scrollAmount={520}
                  onViewAll={() => navigate("/library")}
                  renderItem={(game) => (
                    <GameCard game={game} showLibraryStatus />
                  )}
                />
              </div>
            ) : (
              <div className="profile-empty-collection">
                <Gamepad2 size={34} />

                <h3>Your collection is empty</h3>

                <p>Start discovering games and build your collection.</p>

                <Link to="/" className="profile-discover-button">
                  Discover Games
                </Link>
              </div>
            )}
          </section>

          {/* ==================================================
              ACCOUNT ACTIONS
          ================================================== */}

          <section className="profile-actions-section">
            <Link to="/" className="profile-action-button">
              <ArrowLeft size={17} /> Back to Explore
            </Link>

            <button
              type="button"
              className="profile-action-button profile-signout-button"
              onClick={() => setShowSignOutModal(true)}
            >
              <LogOut size={17} />
              Sign Out
            </button>
          </section>
        </div>
      </main>

      {/* ==================================================
          EDIT PROFILE MODAL
      ================================================== */}

      <EditProfileModal
        open={showEditProfileModal}
        user={user}
        onClose={() => setShowEditProfileModal(false)}
        onSave={updateUserProfile}
      />

      {/* ==================================================
          SIGN OUT CONFIRMATION MODAL
      ================================================== */}

      <SignOutModal
        open={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
        onConfirm={async () => {
          await logout();
          setShowSignOutModal(false);
        }}
      />
    </>
  );
}

export default ProfilePage;
