import React, { useState, useEffect } from "react";
import { db } from "./Firebase/config"; // Adjust path if needed
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import "./UserSearchTable.css"; // Optional for styling

const UserSearchTable = () => {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const querySnapshot = await getDocs(collection(db, "users"));
      const usersData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(usersData);
      setFilteredUsers(usersData);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching users: ", error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const filtered = users.filter((user) => {
      const email = user.email || "";
      const patientId = user.patientId || "";
      const isNurse = user.is_nurse ? "true" : "false"; // Convert boolean to string for search

      return (
        email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patientId.includes(searchQuery) ||
        isNurse.includes(searchQuery.toLowerCase())
      );
    });

    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  const handleDelete = async (userId) => {
    const pin = prompt("Enter PIN to delete user:");
    if (pin === "2012") {
      if (window.confirm("Are you sure you want to delete this user?")) {
        try {
          await deleteDoc(doc(db, "users", userId));
          setUsers(users.filter((user) => user.id !== userId)); // Remove user from state
          setFilteredUsers(filteredUsers.filter((user) => user.id !== userId)); // Update filtered list
          alert("User deleted successfully!");
        } catch (error) {
          console.error("Error deleting user:", error);
          alert("Failed to delete user. Please try again.");
        }
      }
    } else {
      alert("Incorrect PIN. Deletion canceled.");
    }
  };

  return (
    <div className="UserSearchTable-container">
      <h2>Total Users: {filteredUsers.length}</h2> {/* Display total count */}

      <input
        type="text"
        placeholder="Search by email, patient ID, or nurse status..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="UserSearchTable-search"
      />

      {isLoading ? (
        <p>Loading users...</p>
      ) : (
        <table className="UserSearchTable-table">
          <thead>
            <tr>
              <th>#</th> {/* Index column */}
              <th>Email</th>
              <th>Patient ID</th>
              <th>Is Nurse</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user, index) => (
              <tr key={user.id}>
                <td>{index + 1}</td> {/* Index starts from 1 */}
                <td>{user.email || "N/A"}</td>
                <td>{user.patientId || "N/A"}</td>
                <td>{user.is_nurse ? "Yes" : "No"}</td>
                <td>
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="UserSearchTable-delete-btn"
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

export default UserSearchTable;
