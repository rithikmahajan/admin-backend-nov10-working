import React from 'react';

// Extract static styles and content for performance optimization
const STYLES = {
  container: "space-y-6",
  headerSection: "",
  title: "text-2xl font-bold text-gray-900",
  subtitle: "text-gray-600",
  profileCard: "bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center",
  cardTitle: "text-lg font-medium text-gray-900 mb-2",
  cardDescription: "text-gray-600"
};

const CONTENT = {
  title: "Profile",
  subtitle: "Manage your account settings and preferences",
  cardTitle: "User Profile",
  cardDescription: "This page will allow users to update their profile information, change passwords, and manage account settings."
};

const Profile = React.memo(() => {
  return (
    <div className={STYLES.container}>
      <div className={STYLES.headerSection}>
        <h1 className={STYLES.title}>{CONTENT.title}</h1>
        <p className={STYLES.subtitle}>{CONTENT.subtitle}</p>
      </div>
      
      <div className={STYLES.profileCard}>
        <h3 className={STYLES.cardTitle}>{CONTENT.cardTitle}</h3>
        <p className={STYLES.cardDescription}>{CONTENT.cardDescription}</p>
      </div>
    </div>
  );
});

Profile.displayName = 'Profile';

export default Profile;
