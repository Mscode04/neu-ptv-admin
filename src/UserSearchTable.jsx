import React, { useState, useEffect } from "react";
import { db } from "./Firebase/config"; // Adjust path if needed
import { collection, getDocs, deleteDoc, doc, addDoc } from "firebase/firestore";
import "./UserSearchTable.css"; // Optional for styling
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const UserSearchTable = () => {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    patientId: "",
    is_nurse: false,
  });

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
          toast.success("User deleted successfully!");
        } catch (error) {
          console.error("Error deleting user:", error);
          toast.error("Failed to delete user. Please try again.");
        }
      }
    } else {
      toast.error("Incorrect PIN. Deletion canceled.");
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const docRef = await addDoc(collection(db, "users"), {
        email: newUser.email,
        password: newUser.password, // Note: Storing passwords in Firestore is not recommended for production
        patientId: newUser.patientId,
        is_nurse: newUser.is_nurse,
      });
      toast.success("User added successfully!");
      setNewUser({ email: "", password: "", patientId: "", is_nurse: false });
      setIsModalOpen(false);
      fetchUsers(); // Refresh the user list
    } catch (error) {
      console.error("Error adding user: ", error);
      toast.error("Failed to add user. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="UserSearchTable-container">
      <ToastContainer />
      <h2>Total Users: {filteredUsers.length}</h2> {/* Display total count */}

      <button onClick={() => setIsModalOpen(true)} className="UserSearchTable-add-btn">
        ➕ Add User
      </button>

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

      {isModalOpen && (
        <div className="UserSearchTable-modal-overlay">
          <div className="UserSearchTable-modal">
            <div className="UserSearchTable-modal-header">
              <h2>Add New User</h2>
              <button
                className="UserSearchTable-close-btn"
                onClick={() => setIsModalOpen(false)}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleAddUser}>
              <div className="UserSearchTable-form-group">
                <label>Email:</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  required
                />
              </div>
              <div className="UserSearchTable-form-group">
                <label>Password:</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  required
                />
              </div>
              <div className="UserSearchTable-form-group">
                <label>Patient ID:</label>
                <input
                  type="text"
                  value={newUser.patientId}
                  onChange={(e) => setNewUser({ ...newUser, patientId: e.target.value })}
                  required
                />
              </div>
              <div className="UserSearchTable-form-group">
                <label>Is Nurse:</label>
                <input
                  type="checkbox"
                  checked={newUser.is_nurse}
                  onChange={(e) => setNewUser({ ...newUser, is_nurse: e.target.checked })}
                />
              </div>
              <button type="submit" className="UserSearchTable-submit-btn">
                Add User
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserSearchTable;