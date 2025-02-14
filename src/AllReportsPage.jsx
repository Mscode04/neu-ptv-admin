import React, { useState, useEffect } from "react";
import { db } from "./Firebase/config";
import { collection, getDocs, query, where, doc, deleteDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./AllReportsPage.css";
import "bootstrap/dist/css/bootstrap.min.css"; // Import Bootstrap CSS

const AllReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nameFilter, setNameFilter] = useState("");
  const [formTypeFilter, setFormTypeFilter] = useState("");
  const [addressFilter, setAddressFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [reportToDelete, setReportToDelete] = useState(null);
  const [pin, setPin] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");

  const reportsPerPage = 10;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        setError(null);

        const reportsRef = collection(db, "Reports");
        let q = query(reportsRef);

        if (nameFilter) {
          q = query(q, where("name", ">=", nameFilter), where("name", "<=", nameFilter + "\uf8ff"));
        }
        if (formTypeFilter) {
          q = query(q, where("formType", "==", formTypeFilter));
        }
        if (addressFilter) {
          q = query(q, where("address", ">=", addressFilter), where("address", "<=", addressFilter + "\uf8ff"));
        }

        const querySnapshot = await getDocs(q);
        let reportsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        if (startDate || endDate) {
          const startDateObj = startDate ? new Date(startDate) : null;
          const endDateObj = endDate ? new Date(endDate) : null;
          if (endDateObj) {
            endDateObj.setHours(23, 59, 59, 999);
          }

          reportsData = reportsData.filter((report) => {
            const submittedAtDate = new Date(report.submittedAt);
            if (startDateObj && submittedAtDate < startDateObj) return false;
            if (endDateObj && submittedAtDate > endDateObj) return false;
            return true;
          });
        }

        // Sorting logic
        reportsData.sort((a, b) => {
          const dateA = new Date(a.submittedAt);
          const dateB = new Date(b.submittedAt);
          return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
        });

        setReports(reportsData);
      } catch (error) {
        console.error("Error fetching reports: ", error);
        setError("Failed to load reports. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [nameFilter, formTypeFilter, addressFilter, startDate, endDate, sortOrder]);

  const handleBackClick = () => {
    navigate(-1);
  };

  const handleDeleteClick = (reportId) => {
    setReportToDelete(reportId);
    setShowConfirmation(true);
  };

  const handlePinChange = (e) => {
    setPin(e.target.value);
  };

  const handleConfirmDelete = async () => {
    if (pin === "2012") {
      try {
        await deleteDoc(doc(db, "Reports", reportToDelete));
        setReports(reports.filter((report) => report.id !== reportToDelete));
        setShowConfirmation(false);
        setPin("");
        toast.success("Report deleted successfully!");
      } catch (error) {
        console.error("Error deleting report: ", error);
        toast.error("Failed to delete report.");
      }
    } else {
      toast.error("Incorrect PIN.");
    }
  };

  const handleCancelDelete = () => {
    setShowConfirmation(false);
    setPin("");
  };

  // Pagination logic
  const indexOfLastReport = currentPage * reportsPerPage;
  const indexOfFirstReport = indexOfLastReport - reportsPerPage;
  const currentReports = reports.slice(indexOfFirstReport, indexOfLastReport);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="AllRep-container">
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        toastStyle={{ marginTop: "20px" }}
      />

      
      <h2 className="text-center mb-4">All Reports</h2>

      {/* Filters */}
      <div className="row mb-4">
        <div className="col-md-2">
          <input
            type="text"
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            placeholder="Search by Name"
            className="form-control"
          />
        </div>
        <div className="col-md-2">
          <select
            value={formTypeFilter}
            onChange={(e) => setFormTypeFilter(e.target.value)}
            className="form-control"
          >
            <option value="">Select Form Type</option>
            <option value="NHC">NHC</option>
            <option value="NHC(E)">NHC(E)</option>
            <option value="DHC">DHC</option>
            <option value="PROGRESSION REPORT">Progression Report</option>
            <option value="SOCIAL REPORT">Social Report</option>
            <option value="VHC">VHC</option>
            <option value="GVHC">GVHC</option>
            <option value="INVESTIGATION">Investigation</option>
            <option value="DEATH">Death</option>
          </select>
        </div>
        <div className="col-md-2">
          <input
            type="text"
            value={addressFilter}
            onChange={(e) => setAddressFilter(e.target.value)}
            placeholder="Search by Address"
            className="form-control"
          />
        </div>
        <div className="col-md-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            placeholder="Start Date"
            className="form-control"
          />
        </div>
        <div className="col-md-2">
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            placeholder="End Date"
            className="form-control"
          />
        </div>
        <div className="col-md-2">
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="form-control"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center">
          <img
            src="https://media.giphy.com/media/YMM6g7x45coCKdrDoj/giphy.gif"
            alt="Loading..."
            className="loading-image"
          />
        </div>
      ) : error ? (
        <p className="text-danger text-center">{error}</p>
      ) : reports.length === 0 ? (
        <p className="text-center">No reports found.</p>
      ) : (
        <>
          <table className="table table-striped table-bordered">
            <thead>
              <tr>
                <th>Form Type</th>
                <th>Name</th>
                <th>Address</th>
                <th>Submitted At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentReports.map((report) => (
                <tr key={report.id}>
                  <td>{report.formType || "N/A"}</td>
                  <td>{report.name || "N/A"}</td>
                  <td>{report.address || "N/A"}</td>
                  <td>
                    {report.submittedAt
                      ? new Date(report.submittedAt).toLocaleString("en-US", {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "numeric",
                          second: "numeric",
                          hour12: true,
                        })
                      : "N/A"}
                  </td>
                  <td>
                    <button
                      onClick={() => handleDeleteClick(report.id)}
                      className="btn btn-danger btn-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="d-flex justify-content-center mt-4">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="btn btn-primary mx-2"
            >
              Previous
            </button>
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={indexOfLastReport >= reports.length}
              className="btn btn-primary mx-2"
            >
              Next
            </button>
          </div>
        </>
      )}

      {showConfirmation && (
        <div className="AllRep-confirmation-box">
          <p>Enter PIN to delete the report:</p>
          <input
            type="password"
            value={pin}
            onChange={handlePinChange}
            placeholder="Enter PIN"
            className="form-control mb-2"
          />
          <button onClick={handleConfirmDelete} className="btn btn-danger mr-2">
            Confirm
          </button>
          <button onClick={handleCancelDelete} className="btn btn-secondary">
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export default AllReportsPage;