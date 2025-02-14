import React, { useState, useEffect } from "react";
import { db } from "./Firebase/config"; // Adjust the path if necessary
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";
import "./PatientTable.css";
import { useNavigate } from "react-router-dom";

const PatientTable = () => {
  const [patients, setPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState("All");
  const [sortOrder, setSortOrder] = useState("asc");
  const [sortBy, setSortBy] = useState("name");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [patientToDelete, setPatientToDelete] = useState(null);
  const predefinedPin = "1234"; // Replace with a secure PIN
  const patientsPerPage = 100;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setIsLoading(true);
        const querySnapshot = await getDocs(collection(db, "Patients"));
        const patientsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPatients(patientsData);
        setFilteredPatients(patientsData);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching patients: ", error);
        setIsLoading(false);
      }
    };

    fetchPatients();
  }, []);

  useEffect(() => {
    let filtered = patients.filter((patient) => {
      const name = patient.name || "";
      const address = patient.address || "";
      const caretakerPhone = patient.mainCaretakerPhone || "";
      const mainDiagnosis = patient.mainDiagnosis || "";
      const registernumber = patient.registernumber || "";
      const isDeactivated = patient.deactivated || false;

      const matchesSearchQuery =
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        caretakerPhone.includes(searchQuery) ||
        mainDiagnosis.toLowerCase().includes(searchQuery.toLowerCase()) ||
        registernumber.includes(searchQuery);

      const matchesDiagnosis =
        selectedDiagnosis === "All" || patient.mainDiagnosis === selectedDiagnosis;

      const matchesStatus =
        selectedStatus === "All" ||
        (selectedStatus === "Active" && !isDeactivated) ||
        (selectedStatus === "Inactive" && isDeactivated);

      return matchesSearchQuery && matchesDiagnosis && matchesStatus;
    });

    if (sortBy === "name") {
      filtered.sort((a, b) => {
        const nameA = a.name || "";
        const nameB = b.name || "";
        return sortOrder === "asc"
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA);
      });
    } else if (sortBy === "registernumber") {
      filtered.sort((a, b) => {
        const parseRegisterNumber = (reg) => {
          if (!reg) return { number: Infinity, year: Infinity };
          const parts = reg.split("/");
          const number = parseInt(parts[0]) || 0;
          const year = parts[1] ? 2000 + parseInt(parts[1]) : 0;
          return { number, year };
        };

        const regA = parseRegisterNumber(a.registernumber);
        const regB = parseRegisterNumber(b.registernumber);

        if (regA.year !== regB.year) {
          return sortOrder === "asc" ? regA.year - regB.year : regB.year - regA.year;
        }
        return sortOrder === "asc" ? regA.number - regB.number : regB.number - regA.number;
      });
    }

    setFilteredPatients(filtered);
    setCurrentPage(1);
  }, [searchQuery, selectedDiagnosis, selectedStatus, sortOrder, sortBy, patients]);

  const indexOfLastPatient = currentPage * patientsPerPage;
  const indexOfFirstPatient = indexOfLastPatient - patientsPerPage;
  const currentPatients = filteredPatients.slice(indexOfFirstPatient, indexOfLastPatient);

  const totalPages = Math.ceil(filteredPatients.length / patientsPerPage);

  const uniqueDiagnoses = [
    "All",
    ...new Set(patients.map((patient) => patient.mainDiagnosis).filter(Boolean)),
  ];

  const handleDelete = async (patientId) => {
    if (pinInput === predefinedPin) {
      try {
        await deleteDoc(doc(db, "Patients", patientId));
        setPatients(patients.filter((patient) => patient.id !== patientId));
        setFilteredPatients(filteredPatients.filter((patient) => patient.id !== patientId));
        setIsDeleteModalOpen(false);
        setPinInput("");
      } catch (error) {
        console.error("Error deleting patient: ", error);
      }
    } else {
      alert("Incorrect PIN. Deletion canceled.");
      setIsDeleteModalOpen(false);
      setPinInput("");
    }
  };

  const handleDeleteClick = (patientId) => {
    setPatientToDelete(patientId);
    setIsDeleteModalOpen(true);
  };

  const handleCardClick = (patientId) => {
    navigate(`/main/patient/${patientId}`);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="PatientTable-container">
    

      <div className="PatientTable-total-count">
        Total Patients: {filteredPatients.length}
      </div>

      <div className="PatientTable-search-bar">
        <input
          type="text"
          placeholder="Search by name, phone number, address, diagnosis, or register number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="PatientTable-filters">
        <label>
          Filter by Diagnosis:
          <select value={selectedDiagnosis} onChange={(e) => setSelectedDiagnosis(e.target.value)}>
            {uniqueDiagnoses.map((diagnosis) => (
              <option key={diagnosis} value={diagnosis}>
                {diagnosis}
              </option>
            ))}
          </select>
        </label>

        <label>
          Filter by Status:
          <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
            <option value="All">All</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </label>

        <label>
          Sort by:
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="name">Name</option>
            <option value="registernumber">Register Number</option>
          </select>
        </label>

        <label>
          Order:
          <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </label>
      </div>

      {isLoading ? (
        <div className="PatientTable-loading-indicator">
          <div className="loading-container">
            <img
              src="https://media.giphy.com/media/YMM6g7x45coCKdrDoj/giphy.gif"
              alt="Loading..."
              className="loading-image"
            />
          </div>
        </div>
      ) : (
        <>
          <table className="PatientTable-table">
            <thead>
              <tr>
                <th>Register Number</th>
                <th>Name</th>
                <th>Address</th>
                <th>Phone</th>
                <th>Diagnosis</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentPatients.map((patient) => {
                const is2012Patient = patient.registernumber && patient.registernumber.includes("/12");
                return (
                  <tr key={patient.id} onClick={() => handleCardClick(patient.id)}>
                    <td>{patient.registernumber || "N/A"}</td>
                    <td>{patient.name || "N/A"}</td>
                    <td>{patient.address || "N/A"}</td>
                    <td>{patient.mainCaretakerPhone || "N/A"}</td>
                    <td>{patient.mainDiagnosis || "N/A"}</td>
                    <td>
                      <span
                        style={{
                          color: patient.deactivated ? "red" : "green",
                        }}
                      >
                        {patient.deactivated ? "Inactive" : "Active"}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(patient.id);
                        }}
                        className="PatientTable-delete-button"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="PatientTable-pagination">
            <button onClick={handlePreviousPage} disabled={currentPage === 1} className="PatientTable-pagination-btn">
              Previous
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button onClick={handleNextPage} disabled={currentPage === totalPages} className="PatientTable-pagination-btn">
              Next
            </button>
          </div>
        </>
      )}

      {isDeleteModalOpen && (
        <div className="PatientTable-delete-modal">
          <div className="PatientTable-delete-modal-content">
            <h3>Confirm Deletion</h3>
            <p>Enter the PIN to confirm deletion:</p>
            <input
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="Enter PIN"
            />
            <div className="PatientTable-delete-modal-buttons">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setPinInput("");
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(patientToDelete)}
                className="PatientTable-delete-button"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientTable;