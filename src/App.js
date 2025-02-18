import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  TextField,
  Box,
  Modal,
  Grid,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  IconButton,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  Assessment as ReportsIcon,
  People as UsersIcon,
  Person as PatientsIcon,
  ExitToApp as LogoutIcon,
  AccountCircle as ProfileIcon,
  Facebook,
  Twitter,
  LinkedIn,
} from '@mui/icons-material';
import AllReportsPage from './AllReportsPage';
import PatientTable from './PatientTable';
import UserSearchTable from './UserSearchTable';
import LoginDataTable from './LoginDataTable';
import { db } from './Firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import './App.css';
import logo from './logo.png'; // Import your logo here

function App() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [openLoginModal, setOpenLoginModal] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setIsLoggedIn(true);
      setUsername(savedUser);
    }

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchChartData();
    }
  }, [isLoggedIn]);

  const fetchChartData = async () => {
    const collections = ["Patients", "Reports", "users", "logindata"]; // Added "logins" collection
    const counts = await Promise.all(
      collections.map(async (collectionName) => {
        const snapshot = await getDocs(collection(db, collectionName));
        return { name: collectionName, value: snapshot.size };
      })
    );
    setChartData(counts);
  };

  const handleInstallClick = () => {
    if (installPrompt) {
      installPrompt.prompt();
      installPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === "accepted") {
          console.log("User accepted the install prompt");
        } else {
          console.log("User dismissed the install prompt");
        }
        setInstallPrompt(null);
      });
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === "admin") {
      localStorage.setItem("user", username);
      setIsLoggedIn(true);
      setOpenLoginModal(false);
      navigate("/");
    } else {
      alert("Invalid username contact Neuraq");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setUsername("");
    navigate("/login");
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042']; // Added a color for the new "logins" data

  const pieData = chartData.map((data) => ({
    name: data.name,
    value: data.value,
  }));

  return (
    <>
      <AppBar position="static" className="appbar">
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={toggleSidebar}>
            <MenuIcon />
          </IconButton>
          <img src={logo} alt="Logo" className="logo" /> {/* Add your logo here */}
          <Typography variant="h6" className="title">
            Admin DB
          </Typography>
          {isLoggedIn ? (
            <>
              <Button color="inherit" component={Link} to="/">
                Home
              </Button>
              <Button color="inherit" component={Link} to="/reports">
                Reports
              </Button>
              <Button color="inherit" component={Link} to="/users">
                Users
              </Button>
              <Button color="inherit" component={Link} to="/patients">
                Patients
              </Button>
              <Button color="inherit" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <Button color="inherit" onClick={() => setOpenLoginModal(true)}>
              Login
            </Button>
          )}
          {installPrompt && (
            <Button color="inherit" onClick={handleInstallClick}>
              Install App
            </Button>
          )}
        </Toolbar>
      </AppBar>

      <Drawer open={sidebarOpen} onClose={toggleSidebar}>
        <Box sx={{ width: 250 }} role="presentation">
   
          <Divider />
          <List>
            <ListItem button component={Link} to="/">
              <ListItemIcon>
                <HomeIcon />
              </ListItemIcon>
              <ListItemText primary="Home" />
            </ListItem>
            <ListItem button component={Link} to="/reports">
              <ListItemIcon>
                <ReportsIcon />
              </ListItemIcon>
              <ListItemText primary="Reports" />
            </ListItem>
            <ListItem button component={Link} to="/users">
              <ListItemIcon>
                <UsersIcon />
              </ListItemIcon>
              <ListItemText primary="Users" />
            </ListItem>
            <ListItem button component={Link} to="/patients">
              <ListItemIcon>
                <PatientsIcon />
              </ListItemIcon>
              <ListItemText primary="Patients" />
            </ListItem>
            <ListItem button onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItem>
          </List>
          <Divider />
        </Box>
      </Drawer>

      <Container className="content">
        <Routes>
          {isLoggedIn ? (
            <>
              <Route path="/reports" element={<AllReportsPage />} />
              <Route path="/logindata" element={<LoginDataTable />} />
              <Route path="/patients" element={<PatientTable />} />
              <Route path="/users" element={<UserSearchTable />} />
              <Route
                path="/"
                element={
                  <>
                    <Typography variant="h4" gutterBottom className="m-5">
                      Welcome, Neuraq Admin For Palliative Makkaraparamab!
                    </Typography>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="h6" gutterBottom>
                          Data Overview
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value">
                              {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="h6" gutterBottom>
                          Data Distribution
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={pieData}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={100}
                              fill="#8884d8"
                              label
                            />
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </Grid>
                    </Grid>
                    <Grid container spacing={2} justifyContent="center" style={{ marginTop: '20px' }}>
                      <Grid item>
                        <Button variant="contained" color="primary" component={Link} to="/reports">
                          All Reports
                        </Button>
                      </Grid>
                      <Grid item>
                        <Button variant="contained" color="secondary" component={Link} to="/users">
                          User Table
                        </Button>
                      </Grid>
                      <Grid item>
                        <Button variant="contained" color="success" component={Link} to="/patients">
                          Patient Table
                        </Button>
                      </Grid>
                      <Grid item>
                        <Button variant="contained" color="success" component="a" href="https://Mscode04.github.io/Palliative-Nauraq">
                          App
                        </Button>
                      </Grid>
                      <Grid item>
                        <Button variant="contained" color="success" component="a" href="https://mscode04.github.io/Neubey/">
                          SoftWare
                        </Button>
                      </Grid>
                      <Grid item>
  <Button variant="contained" color="info" component={Link} to="/logindata">
    Login Data Table
  </Button>
</Grid>
                    </Grid>
                  </>
                }
              />
            </>
          ) : (
            <Route path="*" element={<Typography variant="h5">Please log in.</Typography>} />
          )}
        </Routes>
      </Container>

      <Modal open={openLoginModal} onClose={() => setOpenLoginModal(false)}>
        <Box className="login-modal" component="form" onSubmit={handleLogin}>
          <Typography variant="h4">Login</Typography>
          <TextField
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            fullWidth
            margin="normal"
          />
          <Button type="submit" variant="contained" color="primary">
            Login
          </Button>
        </Box>
      </Modal>
    </>
  );
}

export default App;