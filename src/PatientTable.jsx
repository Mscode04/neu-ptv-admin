import React, { useState, useEffect } from "react";
import { db } from "./Firebase/config"; // Adjust the path if necessary
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import "bootstrap/dist/css/bootstrap.min.css";
import "./PatientTable.css";

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
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deletePin, setDeletePin] = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const [patientsPerPage, setPatientsPerPage] = useState(30); // Default to 30 patients per page
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

  const normalizeDiagnosis = (diagnosis) => {
    if (!diagnosis) return [];
    return diagnosis.split(",").map((d) => d.trim());
  };

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

      const normalizedDiagnosis = normalizeDiagnosis(mainDiagnosis);
      const matchesDiagnosis =
        selectedDiagnosis === "All" || normalizedDiagnosis.includes(selectedDiagnosis);

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
    ...new Set(
      patients
        .flatMap((patient) => normalizeDiagnosis(patient.mainDiagnosis))
        .filter(Boolean)
    ),
  ];

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

  const handleExportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredPatients);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Patients");
    XLSX.writeFile(workbook, "Patients.xlsx");
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "Patients", id));
      setPatients(patients.filter(patient => patient.id !== id));
      setFilteredPatients(filteredPatients.filter(patient => patient.id !== id));
      setConfirmDelete(false);
    } catch (error) {
      console.error("Error deleting patient: ", error);
    }
  };

  const handleConfirmDelete = (id) => {
    setConfirmDelete(true);
    setDeleteId(id);
  };

  const handleCancelDelete = () => {
    setConfirmDelete(false);
    setDeleteId(null);
  };

  const handleDeletePinChange = (e) => {
    setDeletePin(e.target.value);
  };

  const handleDeleteConfirm = () => {
    if (deletePin === "2012") {
      handleDelete(deleteId);
    } else {
      alert("Incorrect PIN. Please try again.");
      setDeletePin("");
    }
  };

  const handlePatientsPerPageChange = (e) => {
    setPatientsPerPage(parseInt(e.target.value, 10));
    setCurrentPage(1); // Reset to the first page when changing the number of patients per page
  };

  return (
    <div className=" mt-4">
      <button className="btn btn-secondary mb-3" onClick={() => navigate(-1)}>
        <i className="bi bi-arrow-left"></i> Back
      </button>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          Total Patients: {filteredPatients.length}
        </div>
        <button className="btn btn-success" onClick={handleExportToExcel}>
          Export to Excel
        </button>
      </div>

      <div className="mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="Search by name, phone number, address, diagnosis, or register number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="row mb-3">
        <div className="col-md-3">
          <label className="form-label">Filter by Diagnosis:</label>
          <select
            className="form-select"
            value={selectedDiagnosis}
            onChange={(e) => setSelectedDiagnosis(e.target.value)}
          >
            {uniqueDiagnoses.map((diagnosis) => (
              <option key={diagnosis} value={diagnosis}>
                {diagnosis}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-3">
          <label className="form-label">Filter by Status:</label>
          <select
            className="form-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="All">All</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
        <div className="col-md-3">
          <label className="form-label">Sort by:</label>
          <select
            className="form-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="name">Name</option>
            <option value="registernumber">Register Number</option>
          </select>
        </div>
        <div className="col-md-3">
          <label className="form-label">Order:</label>
          <select
            className="form-select"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
      </div>

      <div className="row mb-3">
        <div className="col-md-3">
          <label className="form-label">Patients per Page:</label>
          <select
            className="form-select"
            value={patientsPerPage}
            onChange={handlePatientsPerPageChange}
          >
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="30">30</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <>

          <table className="table table-striped table-hover w-100">
            <thead className="table-header">
              <tr>
                <th>Register Number</th>
                <th>Name</th>
                <th>Address</th>
                <th>Phone</th>
                <th>Diagnosis</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {currentPatients.map((patient) => (
                <tr key={patient.id} style={{ cursor: "pointer" }} className={patient.deactivated ? "table-row-inactive" : "table-row-active"}>
                  <td>{patient.registernumber || "N/A"}</td>
                  <td>{patient.name || "N/A"}</td>
                  <td>{patient.address || "N/A"}</td>
                  <td>{patient.mainCaretakerPhone || "N/A"}</td>
                  <td>{normalizeDiagnosis(patient.mainDiagnosis).join(", ") || "N/A"}</td>
                  <td>
                    <span
                      style={{}}
                    >
                      {patient.deactivated ? "Inactive" : "Active"}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleConfirmDelete(patient.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {confirmDelete && (
            <div className="modal" tabIndex="-1" role="dialog" style={{ display: "block" }}>
              <div className="modal-dialog" role="document">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Confirm Delete</h5>
                  </div>
                  <div className="modal-body">
                    <p>Enter PIN to confirm deletion:</p>
                    <input
                      type="text"
                      className="form-control"
                      value={deletePin}
                      onChange={handleDeletePinChange}
                    />
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleCancelDelete}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={handleDeleteConfirm}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="d-flex justify-content-between align-items-center">
            <button
              className="btn btn-primary"
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              className="btn btn-primary"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default PatientTable;