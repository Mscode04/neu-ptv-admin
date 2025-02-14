import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { AppBar, Toolbar, Typography, Button, Container } from "@mui/material";
import { useState, useEffect } from "react";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import AllReportsPage from "./AllReportsPage";
import PatientTable from "./PatientTable";
import UserSearchTable from "./UserSearchTable";
import "./App.css";

function App() {
  const [installPrompt, setInstallPrompt] = useState(null);

  // Listen for the `beforeinstallprompt` event
  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  // Function to trigger the PWA installation prompt
  const handleInstallClick = () => {
    if (installPrompt) {
      installPrompt.prompt();
      installPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === "accepted") {
          console.log("User accepted the install prompt");
        } else {
          console.log("User dismissed the install prompt");
        }
        setInstallPrompt(null); // Clear the prompt after user choice
      });
    }
  };

  return (
    <>
      <AppBar position="static" className="appbar">
        <Toolbar>
          <MenuBookIcon className="icon" />
          <Typography variant="h6" className="title">Dashboard</Typography>
          <Button color="inherit" component={Link} to="/">Home</Button>
          <Button color="inherit" component={Link} to="/reports">All Reports</Button>
          <Button color="inherit" component={Link} to="/users">User Table</Button>
          <Button color="inherit" component={Link} to="/patients">Patient Table</Button>
          {/* {installPrompt && (
            <Button color="inherit" onClick={handleInstallClick}>
              Install App
            </Button>
          )} */}
        </Toolbar>
      </AppBar>
      
      <Container className="content">
        <Routes>
          <Route path="/reports" element={<AllReportsPage />} />
          <Route path="/patients" element={<PatientTable />} />
          <Route path="/users" element={<UserSearchTable />} />
          <Route path="/" element={<h2>Welcome Neuraq Admin Palliative App</h2>} />
        </Routes>
      </Container>
    </>
  );
}

export default App;