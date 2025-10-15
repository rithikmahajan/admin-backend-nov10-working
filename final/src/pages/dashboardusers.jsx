import React, {
  useState,
  useMemo,
  useCallback,
  memo,
  useRef,
  useEffect,
} from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Search,
  Filter,
  Download,
  Users,
  ChevronDown,
  Edit2,
  Trash2,
  Eye,
  UserPlus,
  Mail,
  Phone,
  MapPin,
  Calendar,
  MoreHorizontal,
  Shield,
  ShieldCheck,
  ShieldX,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  FileSpreadsheet,
  Printer,
  Share,
  AlertCircle,
  CheckCircle,
  Database,
} from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { DateRangePicker, calculateDateRange, formatDateRange } from "./dashboardview";

// Redux imports for real-time data
import {
  fetchAllUsers,
  updateUserStatus,
  deleteUser,
  createUser,
  clearError,
  selectUsers,
  selectUsersLoading,
  selectUsersError,
  selectUserStats,
  selectRecentUsers
} from "../store/slices/firebaseUsersSlice";

// Date Range Options (shared from dashboardview.jsx)
const DATE_RANGE_OPTIONS = [
  { label: "Today", value: "today", days: 0 },
  { label: "Yesterday", value: "yesterday", days: 1 },
  { label: "Last 7 Days", value: "7days", days: 7 },
  { label: "Last 14 Days", value: "14days", days: 14 },
  { label: "Last 30 Days", value: "30days", days: 30 },
  { label: "Last 90 Days", value: "90days", days: 90 },
  { label: "This Month", value: "thisMonth", days: null },
  { label: "Last Month", value: "lastMonth", days: null },
  { label: "This Year", value: "thisYear", days: null },
  { label: "Custom Range", value: "custom", days: null },
];

// Mock users data
const generateMockUsers = () => [
  {
    id: 1,
    name: "John Smith",
    email: "john.smith@gmail.com",
    phone: "+1234567890",
    location: "New York, USA",
    status: "active",
    role: "customer",
    joinDate: "2024-01-15",
    lastLogin: "2024-11-27",
    totalOrders: 24,
    totalSpent: 12450.50,
    avatar: null,
    verified: true,
  },
  {
    id: 2,
    name: "Sarah Johnson",
    email: "sarah.j@outlook.com",
    phone: "+1234567891",
    location: "California, USA",
    status: "inactive",
    role: "customer",
    joinDate: "2024-02-22",
    lastLogin: "2024-11-20",
    totalOrders: 18,
    totalSpent: 8750.25,
    avatar: null,
    verified: true,
  },
  {
    id: 3,
    name: "Mike Wilson",
    email: "mike.wilson@yahoo.com",
    phone: "+1234567892",
    location: "Texas, USA",
    status: "active",
    role: "admin",
    joinDate: "2023-11-10",
    lastLogin: "2024-11-27",
    totalOrders: 45,
    totalSpent: 22100.75,
    avatar: null,
    verified: true,
  },
  {
    id: 4,
    name: "Emily Davis",
    email: "emily.davis@gmail.com",
    phone: "+1234567893",
    location: "Florida, USA",
    status: "suspended",
    role: "customer",
    joinDate: "2024-03-05",
    lastLogin: "2024-11-15",
    totalOrders: 12,
    totalSpent: 3200.00,
    avatar: null,
    verified: false,
  },
  {
    id: 5,
    name: "David Brown",
    email: "david.brown@hotmail.com",
    phone: "+1234567894",
    location: "Illinois, USA",
    status: "active",
    role: "customer",
    joinDate: "2024-01-28",
    lastLogin: "2024-11-25",
    totalOrders: 31,
    totalSpent: 15600.30,
    avatar: null,
    verified: true,
  },
  {
    id: 6,
    name: "Lisa Anderson",
    email: "lisa.anderson@gmail.com",
    phone: "+1234567895",
    location: "Washington, USA",
    status: "active",
    role: "moderator",
    joinDate: "2023-12-12",
    lastLogin: "2024-11-26",
    totalOrders: 28,
    totalSpent: 11200.80,
    avatar: null,
    verified: true,
  },
  {
    id: 7,
    name: "James Miller",
    email: "james.miller@yahoo.com",
    phone: "+1234567896",
    location: "Oregon, USA",
    status: "inactive",
    role: "customer",
    joinDate: "2024-04-18",
    lastLogin: "2024-10-30",
    totalOrders: 8,
    totalSpent: 2100.45,
    avatar: null,
    verified: false,
  },
  {
    id: 8,
    name: "Jennifer Taylor",
    email: "jennifer.taylor@outlook.com",
    phone: "+1234567897",
    location: "Nevada, USA",
    status: "active",
    role: "customer",
    joinDate: "2024-02-14",
    lastLogin: "2024-11-27",
    totalOrders: 22,
    totalSpent: 9800.60,
    avatar: null,
    verified: true,
  },
];

// User management hooks
const useUserData = () => {
  const [users, setUsers] = useState(generateMockUsers);
  const [loading, setLoading] = useState(false);

  const refreshUsers = useCallback(async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setUsers(generateMockUsers());
      setLoading(false);
    }, 1000);
  }, []);

  const updateUserStatus = useCallback((userId, newStatus) => {
    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.id === userId ? { ...user, status: newStatus } : user
      )
    );
  }, []);

  const deleteUser = useCallback((userId) => {
    setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
  }, []);

  return {
    users,
    loading,
    refreshUsers,
    updateUserStatus,
    deleteUser,
  };
};

// User Statistics Component
const UserStats = memo(({ users, dateRange }) => {
  const stats = useMemo(() => {
    const totalUsers = users.length;
    const activeUsers = users.filter((user) => user.status === "active").length;
    const newUsers = users.filter((user) => {
      const joinDate = new Date(user.joinDate);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return joinDate >= thirtyDaysAgo;
    }).length;
    const verifiedUsers = users.filter((user) => user.verified).length;

    return [
      {
        title: "Total Users",
        value: totalUsers.toLocaleString(),
        icon: Users,
        change: "+12.5%",
        trending: "up",
        bgColor: "bg-blue-50",
        iconColor: "text-blue-600",
      },
      {
        title: "Active Users",
        value: activeUsers.toLocaleString(),
        icon: ShieldCheck,
        change: "+8.2%",
        trending: "up",
        bgColor: "bg-green-50",
        iconColor: "text-green-600",
      },
      {
        title: "New Users",
        value: newUsers.toLocaleString(),
        icon: UserPlus,
        change: "-2.1%",
        trending: "down",
        bgColor: "bg-purple-50",
        iconColor: "text-purple-600",
      },
      {
        title: "Verified Users",
        value: verifiedUsers.toLocaleString(),
        icon: Shield,
        change: "+15.7%",
        trending: "up",
        bgColor: "bg-yellow-50",
        iconColor: "text-yellow-600",
      },
    ];
  }, [users]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-white p-6 rounded-xl shadow-sm border-2 border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 ${stat.bgColor} rounded-lg`}>
                <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
            <div
              className={`flex items-center space-x-1 ${
                stat.trending === "up" ? "text-green-600" : "text-red-600"
              }`}
            >
              {stat.trending === "up" ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span className="text-sm font-medium">{stat.change}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

UserStats.displayName = "UserStats";

// User Table Component
const UserTable = memo(({ users, onUpdateStatus, onDeleteUser, onViewUser, onEditUser }) => {
  const [actionDropdown, setActionDropdown] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActionDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { bg: "bg-green-100", text: "text-green-800", label: "Active" },
      inactive: { bg: "bg-gray-100", text: "text-gray-800", label: "Inactive" },
      suspended: { bg: "bg-red-100", text: "text-red-800", label: "Suspended" },
    };

    const config = statusConfig[status] || statusConfig.inactive;

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${config.bg} ${config.text}`}
      >
        {config.label}
      </span>
    );
  };

  const getRoleBadge = (role) => {
    const roleConfig = {
      admin: { bg: "bg-purple-100", text: "text-purple-800", label: "Admin" },
      moderator: { bg: "bg-blue-100", text: "text-blue-800", label: "Moderator" },
      customer: { bg: "bg-gray-100", text: "text-gray-800", label: "Customer" },
    };

    const config = roleConfig[role] || roleConfig.customer;

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${config.bg} ${config.text}`}
      >
        {config.label}
      </span>
    );
  };

  const handleActionClick = (userId, action) => {
    setActionDropdown(null);
    switch (action) {
      case "view":
        onViewUser(userId);
        break;
      case "edit":
        onEditUser(userId);
        break;
      case "activate":
        onUpdateStatus(userId, "active");
        break;
      case "suspend":
        onUpdateStatus(userId, "suspended");
        break;
      case "delete":
        if (window.confirm("Are you sure you want to delete this user?")) {
          onDeleteUser(userId);
        }
        break;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Orders
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Spent
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Joined
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => {
              const userName = user.displayName || user.email?.split('@')[0] || 'Unknown User';
              const userEmail = user.email || 'No email';
              const userPhone = user.phoneNumber || 'No phone';
              const userStatus = user.disabled ? 'blocked' : 'active';
              const isEmailVerified = user.emailVerified;
              const userRole = user.customClaims?.role || 'customer';
              const creationTime = user.creationTime ? new Date(user.creationTime).toLocaleDateString() : 'Unknown';
              const lastSignIn = user.lastSignInTime ? new Date(user.lastSignInTime).toLocaleDateString() : 'Never';
              
              return (
                <tr key={user.uid} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-sm font-medium text-white">
                          {userName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center space-x-2">
                          <div className="text-sm font-medium text-gray-900">
                            {userName}
                          </div>
                          {isEmailVerified && (
                            <ShieldCheck className="h-4 w-4 text-green-500" title="Email Verified" />
                          )}
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Firebase
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.providerData?.[0]?.providerId || 'email'} • {userRole}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{userEmail}</div>
                    <div className="text-sm text-gray-500">{userPhone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(userStatus)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getRoleBadge(userRole)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="text-sm text-gray-900">Created: {creationTime}</div>
                    <div className="text-sm text-gray-500">Last login: {lastSignIn}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {creationTime}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="relative inline-block text-left">
                      <button
                        onClick={() =>
                          setActionDropdown(
                            actionDropdown === user.uid ? null : user.uid
                          )
                        }
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <MoreHorizontal className="h-5 w-5" />
                      </button>

                      {actionDropdown === user.uid && (
                        <div className="absolute right-0 top-full mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-lg z-50 min-w-[150px]">
                          <div className="p-1">
                            <button
                              onClick={() => handleActionClick(user.uid, "view")}
                              className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150 flex items-center space-x-2"
                            >
                              <Eye className="h-4 w-4" />
                              <span>View</span>
                            </button>
                            <button
                              onClick={() => handleActionClick(user.uid, "edit")}
                              className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150 flex items-center space-x-2"
                            >
                              <Edit2 className="h-4 w-4" />
                              <span>Edit</span>
                            </button>
                            {userStatus !== "active" && (
                              <button
                                onClick={() => handleUpdateUserStatus(user.uid, false)}
                                className="w-full text-left px-3 py-2 rounded-md text-sm text-green-700 hover:bg-green-50 transition-colors duration-150 flex items-center space-x-2"
                              >
                                <ShieldCheck className="h-4 w-4" />
                                <span>Activate</span>
                              </button>
                            )}
                            {userStatus !== "blocked" && (
                              <button
                                onClick={() => handleUpdateUserStatus(user.uid, true)}
                                className="w-full text-left px-3 py-2 rounded-md text-sm text-orange-700 hover:bg-orange-50 transition-colors duration-150 flex items-center space-x-2"
                              >
                                <ShieldX className="h-4 w-4" />
                                <span>Block</span>
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteUser(user.uid)}
                              className="w-full text-left px-3 py-2 rounded-md text-sm text-red-700 hover:bg-red-50 transition-colors duration-150 flex items-center space-x-2"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
});

UserTable.displayName = "UserTable";

// Main Dashboard Users Component
const DashboardUsers = memo(() => {
  const dispatch = useDispatch();
  
  // Redux state selectors
  const users = useSelector(selectUsers);
  const loading = useSelector(selectUsersLoading);
  const error = useSelector(selectUsersError);
  const userStats = useSelector(selectUserStats);
  const recentUsers = useSelector(selectRecentUsers);

  // Local component state
  const [selectedDateRange, setSelectedDateRange] = useState({
    label: "Last 30 Days",
    value: "30days",
    days: 30,
  });
  const [dateRange, setDateRange] = useState("Nov 11, 2025 – Nov 27, 2025");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [actionDropdown, setActionDropdown] = useState(null);
  const exportDropdownRef = useRef(null);

  // Fetch users on component mount and setup auto-refresh
  useEffect(() => {
    dispatch(fetchAllUsers());
    
    // Auto-refresh every 30 seconds for real-time data
    const refreshInterval = setInterval(() => {
      dispatch(fetchAllUsers());
      setLastRefresh(new Date());
    }, 30000);

    return () => clearInterval(refreshInterval);
  }, [dispatch]);

  // Manual refresh function
  const refreshUsers = useCallback(() => {
    dispatch(fetchAllUsers());
    setLastRefresh(new Date());
  }, [dispatch]);

  // User actions
  const handleUpdateUserStatus = useCallback((uid, disabled) => {
    dispatch(updateUserStatus({ uid, disabled }));
  }, [dispatch]);

  const handleDeleteUser = useCallback((uid) => {
    dispatch(deleteUser(uid));
  }, [dispatch]);

  // Clear errors when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  // Handle action clicks from the dropdown menu
  const handleActionClick = useCallback((userId, action) => {
    setActionDropdown(null);
    
    switch (action) {
      case "view":
        console.log("View user:", userId);
        // Add your view user logic here
        break;
      case "edit":
        console.log("Edit user:", userId);
        // Add your edit user logic here
        break;
      case "activate":
        handleUpdateUserStatus(userId, false);
        break;
      case "suspend":
      case "block":
        handleUpdateUserStatus(userId, true);
        break;
      case "delete":
        if (confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
          handleDeleteUser(userId);
        }
        break;
      default:
        console.log("Unknown action:", action);
    }
  }, [handleUpdateUserStatus, handleDeleteUser]);

  // Filter users based on search and filters with Firebase user data structure
  const filteredUsers = useMemo(() => {
    if (!users || !Array.isArray(users)) return [];
    
    return users.filter((user) => {
      const userName = user.displayName || user.email?.split('@')[0] || 'Unknown User';
      const userEmail = user.email || '';
      const userPhone = user.phoneNumber || '';
      
      const matchesSearch =
        userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        userPhone.includes(searchTerm);

      // Map Firebase status to our filter values
      const userStatus = user.disabled ? 'blocked' : 'active';
      const matchesStatus = statusFilter === "all" || userStatus === statusFilter;
      
      // Default role mapping for Firebase users
      const userRole = user.customClaims?.role || 'customer';
      const matchesRole = roleFilter === "all" || userRole === roleFilter;

      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [users, searchTerm, statusFilter, roleFilter]);

  // Close export dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        exportDropdownRef.current &&
        !exportDropdownRef.current.contains(event.target)
      ) {
        setExportDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDateRangeChange = useCallback((rangeOption) => {
    setSelectedDateRange(rangeOption);
    const { startDate, endDate } = calculateDateRange(rangeOption);
    const formattedRange = formatDateRange(startDate, endDate);
    setDateRange(formattedRange);
  }, []);

  const handleViewUser = useCallback((userId) => {
    const user = users.find((u) => u.id === userId);
    console.log("View user:", user);
    // Implement user view modal or navigation
  }, [users]);

  const handleEditUser = useCallback((userId) => {
    const user = users.find((u) => u.id === userId);
    console.log("Edit user:", user);
    // Implement user edit modal or navigation
  }, [users]);

  // Export functions
  const handleExportPDF = useCallback(() => {
    try {
      const doc = new jsPDF();

      doc.setFontSize(20);
      doc.text("Users Report", 20, 30);

      doc.setFontSize(12);
      doc.text(`Date Range: ${selectedDateRange.label}`, 20, 45);
      doc.text(`Period: ${dateRange}`, 20, 55);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 65);

      const tableData = filteredUsers.map((user) => [
        user.name || "N/A",
        user.email || "N/A",
        user.status || "N/A",
        user.role || "N/A",
        (user.totalOrders || 0).toString(),
        `₹${(user.totalSpent || 0).toFixed(2)}`,
        user.joinDate ? new Date(user.joinDate).toLocaleDateString() : "N/A",
      ]);

      doc.autoTable({
        startY: 75,
        head: [["Name", "Email", "Status", "Role", "Orders", "Spent", "Joined"]],
        body: tableData,
        theme: "grid",
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255] },
      });

      doc.save(`users-report-${selectedDateRange.value}-${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (error) {
      console.error("Error exporting PDF:", error);
      alert("Error generating PDF report. Please try again.");
    }
  }, [filteredUsers, selectedDateRange, dateRange]);

  const handleExportExcel = useCallback(() => {
    try {
      const wb = XLSX.utils.book_new();

      const usersWS = XLSX.utils.json_to_sheet(
        filteredUsers.map((user) => ({
          Name: user.name || "N/A",
          Email: user.email || "N/A",
          Phone: user.phone || "N/A",
          Location: user.location || "N/A",
          Status: user.status || "N/A",
          Role: user.role || "N/A",
          "Total Orders": user.totalOrders || 0,
          "Total Spent": user.totalSpent || 0,
          "Join Date": user.joinDate || "N/A",
          "Last Login": user.lastLogin || "N/A",
          Verified: user.verified ? "Yes" : "No",
        }))
      );

      XLSX.utils.book_append_sheet(wb, usersWS, "Users");

      const fileName = `users-report-${selectedDateRange.value}-${new Date().toISOString().split("T")[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error("Error exporting Excel:", error);
      alert("Error generating Excel report. Please try again.");
    }
  }, [filteredUsers, selectedDateRange]);

  const handleExport = (type) => {
    setExportDropdownOpen(false);
    switch (type) {
      case "pdf":
        handleExportPDF();
        break;
      case "excel":
        handleExportExcel();
        break;
      case "share":
        if (navigator.share) {
          navigator.share({
            title: "Users Report",
            text: `Users Report for ${dateRange}`,
            url: window.location.href,
          });
        } else {
          navigator.clipboard.writeText(window.location.href);
          alert("Link copied to clipboard!");
        }
        break;
      case "print":
        // Add print-specific classes before printing
        document.body.classList.add('printing');
        setTimeout(() => {
          window.print();
          // Remove print classes after printing
          setTimeout(() => {
            document.body.classList.remove('printing');
          }, 100);
        }, 100);
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Real-time Database Dashboard Status */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm border-2 border-blue-200 p-6 print-clean print-header">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Database className="h-8 w-8 text-blue-600" />
            <div>
              <h3 className="text-xl font-bold text-blue-900">Database Dashboard - Live User Data</h3>
              <p className="text-blue-700 text-sm">
                Real-time Firebase users via Redux & Axios • Last updated: {lastRefresh.toLocaleTimeString()}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
              loading ? 'bg-yellow-100 text-yellow-800' : error ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
            }`}>
              {loading ? (
                <>
                  <div className="w-2 h-2 bg-yellow-600 rounded-full animate-pulse"></div>
                  <span>Syncing...</span>
                </>
              ) : error ? (
                <>
                  <AlertCircle className="h-3 w-3 text-red-600" />
                  <span>Error</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  <span>Live</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Live Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-600">Total Users</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{userStats?.totalUsers || users?.length || 0}</p>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-green-200">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-gray-600">Active Users</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{userStats?.activeUsers || 0}</p>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-red-200">
            <div className="flex items-center space-x-2">
              <ShieldX className="h-5 w-5 text-red-600" />
              <span className="text-sm font-medium text-gray-600">Blocked Users</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{userStats?.blockedUsers || 0}</p>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-purple-200">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium text-gray-600">This Month</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{userStats?.newUsersThisMonth || 0}</p>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-red-800 font-medium">Connection Error:</p>
            </div>
            <p className="text-red-700 text-sm mt-1">{error}</p>
            <button
              onClick={refreshUsers}
              className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors"
            >
              Retry Connection
            </button>
          </div>
        )}
      </div>

      {/* Users Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <p className="text-gray-600 mt-1">
            Manage and monitor your users and their activities • {filteredUsers.length} users displayed
          </p>
        </div>

        <div className="flex items-center space-x-3 print-hide">
          <DateRangePicker
            selectedRange={selectedDateRange}
            onRangeChange={handleDateRangeChange}
            dateRange={dateRange}
          />

          <button
            onClick={refreshUsers}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          <div className="relative print-hide" ref={exportDropdownRef}>
            <button
              onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
              className="flex items-center space-x-2 px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${
                  exportDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {exportDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-lg z-50 min-w-[160px]">
                <div className="p-1">
                  <button
                    onClick={() => handleExport("excel")}
                    className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150 flex items-center space-x-2"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-green-600" />
                    <span>Export as Excel</span>
                  </button>
                  <button
                    onClick={() => handleExport("pdf")}
                    className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150 flex items-center space-x-2"
                  >
                    <Download className="h-4 w-4 text-red-600" />
                    <span>Export as PDF</span>
                  </button>
                  <button
                    onClick={() => handleExport("share")}
                    className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150 flex items-center space-x-2"
                  >
                    <Share className="h-4 w-4 text-blue-600" />
                    <span>Share</span>
                  </button>
                  <button
                    onClick={() => handleExport("print")}
                    className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150 flex items-center space-x-2"
                  >
                    <Printer className="h-4 w-4 text-gray-600" />
                    <span>Print</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Statistics */}
      <UserStats users={filteredUsers} dateRange={dateRange} />

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-xl shadow-sm border-2 border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="moderator">Moderator</option>
            <option value="customer">Customer</option>
          </select>

          <div className="text-sm text-gray-600 flex items-center">
            Showing {filteredUsers.length} of {users.length} users
          </div>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-12 print-hide">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-500">Loading users...</p>
          </div>
        </div>
      ) : (
        <div className="print-content print-table print-clean">
          <UserTable
            users={filteredUsers}
            onUpdateStatus={updateUserStatus}
            onDeleteUser={deleteUser}
            onViewUser={handleViewUser}
            onEditUser={handleEditUser}
          />
        </div>
      )}
    </div>
  );
});

DashboardUsers.displayName = "DashboardUsers";

export default DashboardUsers;
export { useUserData, UserStats, UserTable };
