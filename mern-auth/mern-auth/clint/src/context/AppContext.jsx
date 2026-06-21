import { createContext, useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

export const AppContent = createContext();

export const AppContextProvider = ({ children }) => {
  // Ensure cookies are sent with every request for authentication
  axios.defaults.withCredentials = true;

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const [isLoggedin, setIsLoggedin] = useState(false);
  const [userData, setUserData] = useState(null);
  const [sendingOtp, setSendingOtp] = useState(false);
  
  // Global category state to sync Navbar and ProductList
  const [activeCategory, setActiveCategory] = useState("All");

  /**
   * Fetches the detailed user profile data
   */
  const getUserData = async () => {
    try {
      const { data } = await axios.get(backendUrl + '/api/user/data');
      if (data.success) {
        setUserData(data.userData);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      // Don't toast error here to avoid spamming the UI on first load
      console.error("Error fetching user data:", error.message);
    }
  };

  /**
   * Checks if the user is authenticated via cookies on page refresh
   */
  const getAuthState = async () => {
    try {
      const { data } = await axios.get(backendUrl + '/api/auth/is-auth');
      if (data.success) {
        setIsLoggedin(true);
        await getUserData(); // Fetch profile details if authenticated
      }
    } catch (error) {
      console.log("Not logged in");
    }
  };

  

  // Run auth check once when the app mounts
  useEffect(() => {
    getAuthState();
  }, []);

  const value = {
    backendUrl,
    isLoggedin,
    setIsLoggedin,
    userData,
    setUserData,
    getUserData,
    sendingOtp,
    setSendingOtp,
    activeCategory,
    setActiveCategory
  };

  return (
    <AppContent.Provider value={value}>
      {children}
    </AppContent.Provider>
  );
};