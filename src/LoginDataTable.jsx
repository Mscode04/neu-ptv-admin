import React, { useState, useEffect } from "react";
import { db } from "./Firebase/config"; // Adjust path if needed
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./LoginDataTable.css"; // Import CSS for styling

const LoginDataTable = () => {
  const [loginData, setLoginData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredLoginData, setFilteredLoginData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLoginData();
  }, []);

  const fetchLoginData = async () => {
    try {
      setIsLoading(true);
      const querySnapshot = await getDocs(collection(db, "logindata"));
      const loginDataArray = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setLoginData(loginDataArray);
      setFilteredLoginData(loginDataArray);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching login data: ", error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const filtered = loginData.filter((data) => {
      const email = data.email || "";
      const device = data.deviceName || "";
      const loggedInAt = data.time ? formatTimestamp(data.time.toDate()) : "";

      return (
        email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loggedInAt.includes(searchQuery)
      );
    });

    setFilteredLoginData(filtered);
  }, [searchQuery, loginData]);

  const handleDelete = async (loginId) => {
    const pin = prompt("Enter PIN to delete login data:");
    if (pin === "2012") {
      if (window.confirm("Are you sure you want to delete this login data?")) {
        try {
          await deleteDoc(doc(db, "logindata", loginId));
          setLoginData(loginData.filter((data) => data.id !== loginId)); // Remove from state
          setFilteredLoginData(filteredLoginData.filter((data) => data.id !== loginId)); // Update filtered list
          toast.success("Login data deleted successfully!");
        } catch (error) {
          console.error("Error deleting login data:", error);
          toast.error("Failed to delete login data. Please try again.");
        }
      }
    } else {
      toast.error("Incorrect PIN. Deletion canceled.");
    }
  };

  // Function to format Firestore timestamp
  const formatTimestamp = (timestamp) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      timeZoneName: "short",
    }).format(timestamp);
  };

  return (
    <div className="LoginDataTable-container">
      <ToastContainer />
      <h2>Total Login Data: {filteredLoginData.length}</h2>

      <input
        type="text"
        placeholder="Search by email, device, or login time..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="LoginDataTable-search"
      />

      {isLoading ? (
        <p>Loading login data...</p>
      ) : (
        <table className="LoginDataTable-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Email</th>
              <th>Device</th>
              <th>Is Nurse</th>
              <th>Patient ID</th>
              <th>Login Time</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLoginData.map((data, index) => (
              <tr key={data.id}>
                <td>{index + 1}</td>
                <td>{data.email || "N/A"}</td>
                <td>{data.deviceName || "N/A"}</td>
                <td>
                  <span
                    className={`nurse-status ${
                      data.isNurse ? "nurse-true" : "nurse-false"
                    }`}
                  >
                    {data.isNurse ? "Nurse" : "User"}
                  </span>
                </td>
                <td>{data.patientId || "N/A"}</td>
                <td>{data.time ? formatTimestamp(data.time.toDate()) : "N/A"}</td>
                <td>
                  <span
                    className={`status-indicator ${
                      data.status === "green" ? "status-green" : "status-red"
                    }`}
                  >
                    {data.status || "N/A"}
                  </span>
                </td>
                <td>
                  <button
                    onClick={() => handleDelete(data.id)}
                    className="LoginDataTable-delete-btn"
                  >
                    🗑 Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default LoginDataTable;