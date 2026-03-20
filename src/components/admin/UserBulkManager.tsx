"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Upload, Users, MoreVertical, Check, X, AlertCircle, Shield, Crown } from "lucide-react";

interface User {
  id: string;
  email: string;
  business_name?: string;
  role: string;
  plan: string;
  is_active: boolean;
  onboarding_complete: boolean;
  created_at: string;
  last_active?: string;
  events_count?: number;
  songs_count?: number;
}

interface BulkOperation {
  type: "activate" | "deactivate" | "upgrade" | "downgrade" | "delete";
  targetIds: string[];
}

export function UserBulkManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkOperation, setBulkOperation] = useState<BulkOperation | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Simple component implementations
  const Button = ({ children, onClick, variant = "default", className = "", disabled = false, ...props }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-lg transition-colors ${variant === "outline"
          ? "border hover:bg-muted"
          : variant === "ghost"
            ? "hover:bg-muted"
            : "bg-primary text-primary-foreground hover:bg-primary/90"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
      {...props}
    >
      {children}
    </button>
  );

  const Checkbox = ({ checked, onCheckedChange, ...props }: any) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      className="w-4 h-4 rounded border"
      {...props}
    />
  );

  const Badge = ({ children, className = "", ...props }: any) => (
    <span
      className={`px-2 py-1 text-xs rounded-full ${className}`}
      {...props}
    >
      {children}
    </span>
  );

  // Simple toast implementation
  const toast = {
    success: (message: string) => {
      console.log('SUCCESS:', message);
      // In real implementation, would show toast
    },
    error: (message: string) => {
      console.log('ERROR:', message);
      // In real implementation, would show toast
    }
  };

  // Load users
  useEffect(() => {
    loadUsers();
  }, []);

  // Filter users
  useEffect(() => {
    let filtered = users;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.business_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Plan filter
    if (planFilter !== "all") {
      filtered = filtered.filter(user => user.plan === planFilter);
    }

    // Status filter
    if (statusFilter !== "all") {
      if (statusFilter === "active") {
        filtered = filtered.filter(user => user.is_active);
      } else if (statusFilter === "inactive") {
        filtered = filtered.filter(user => !user.is_active);
      } else if (statusFilter === "onboarded") {
        filtered = filtered.filter(user => user.onboarding_complete);
      } else if (statusFilter === "not_onboarded") {
        filtered = filtered.filter(user => !user.onboarding_complete);
      }
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, roleFilter, planFilter, statusFilter]);

  // Show/hide bulk actions based on selection
  useEffect(() => {
    setShowBulkActions(selectedUsers.size > 0);
  }, [selectedUsers]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/hq/users");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load users");
      }

      setUsers(data.users || []);
    } catch (error) {
      console.error("Failed to load users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(user => user.id)));
    }
  };

  const handleBulkOperation = async (type: BulkOperation["type"]) => {
    if (selectedUsers.size === 0) return;

    setBulkOperation({
      type,
      targetIds: Array.from(selectedUsers),
    });
  };

  const executeBulkOperation = async () => {
    if (!bulkOperation) return;

    setIsProcessing(true);
    try {
      const response = await fetch("/api/hq/users/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bulkOperation),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Bulk operation failed");
      }

      toast.success(`Successfully ${bulkOperation.type} ${data.affected} users`);
      setSelectedUsers(new Set());
      await loadUsers();
    } catch (error) {
      console.error("Bulk operation failed:", error);
      toast.error("Bulk operation failed");
    } finally {
      setIsProcessing(false);
      setBulkOperation(null);
    }
  };

  const exportUsers = async () => {
    try {
      const response = await fetch("/api/hq/users/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          format: "csv",
          filters: {
            search: searchTerm,
            role: roleFilter,
            plan: planFilter,
            status: statusFilter,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Export failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Users exported successfully");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Export failed");
    }
  };

  const importUsers = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/hq/users/import", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Import failed");
      }

      toast.success(`Successfully imported ${data.imported} users`);
      await loadUsers();
    } catch (error) {
      console.error("Import failed:", error);
      toast.error("Import failed");
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case "staff":
        return <Shield className="w-4 h-4 text-blue-500" />;
      default:
        return <Users className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "owner":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "staff":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case "enterprise":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "premium":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "starter":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center text-muted">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-muted">Manage and organize your user base</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportUsers}
            className="px-4 py-2 border rounded-lg hover:bg-muted transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <label className="cursor-pointer px-4 py-2 border rounded-lg hover:bg-muted transition-colors flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Import
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) importUsers(file);
              }}
            />
          </label>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-card rounded-lg border">
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-3 py-2 rounded-lg border bg-background"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border bg-background"
        >
          <option value="all">All Roles</option>
          <option value="dj">DJ</option>
          <option value="staff">Staff</option>
          <option value="owner">Owner</option>
        </select>
        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border bg-background"
        >
          <option value="all">All Plans</option>
          <option value="free">Free</option>
          <option value="starter">Starter</option>
          <option value="premium">Premium</option>
          <option value="enterprise">Enterprise</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border bg-background"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="onboarded">Onboarded</option>
          <option value="not_onboarded">Not Onboarded</option>
        </select>
      </div>

      {/* Bulk Actions */}
      <AnimatePresence>
        {showBulkActions && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">
                  {selectedUsers.size} users selected
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkOperation("activate")}
                    disabled={isProcessing}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Activate
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkOperation("deactivate")}
                    disabled={isProcessing}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Deactivate
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkOperation("upgrade")}
                    disabled={isProcessing}
                  >
                    <Crown className="w-4 h-4 mr-1" />
                    Upgrade
                  </Button>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedUsers(new Set())}
              >
                Clear selection
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Users Table */}
      <div className="bg-card rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-4 text-left">
                  <Checkbox
                    checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </th>
                <th className="p-4 text-left font-medium">User</th>
                <th className="p-4 text-left font-medium">Role</th>
                <th className="p-4 text-left font-medium">Plan</th>
                <th className="p-4 text-left font-medium">Status</th>
                <th className="p-4 text-left font-medium">Events</th>
                <th className="p-4 text-left font-medium">Songs</th>
                <th className="p-4 text-left font-medium">Joined</th>
                <th className="p-4 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b hover:bg-muted/30">
                  <td className="p-4">
                    <Checkbox
                      checked={selectedUsers.has(user.id)}
                      onCheckedChange={() => handleSelectUser(user.id)}
                    />
                  </td>
                  <td className="p-4">
                    <div>
                      <div className="font-medium">{user.email}</div>
                      {user.business_name && (
                        <div className="text-sm text-muted">{user.business_name}</div>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {getRoleIcon(user.role)}
                      <Badge className={getRoleBadgeColor(user.role)}>
                        {user.role}
                      </Badge>
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge className={getPlanBadgeColor(user.plan)}>
                      {user.plan}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${user.is_active ? "bg-green-500" : "bg-red-500"
                        }`} />
                      <span className="text-sm">
                        {user.is_active ? "Active" : "Inactive"}
                      </span>
                      {user.onboarding_complete && (
                        <Badge variant="secondary" className="text-xs">
                          Onboarded
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-sm">{user.events_count || 0}</td>
                  <td className="p-4 text-sm">{user.songs_count || 0}</td>
                  <td className="p-4 text-sm">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Operation Confirmation */}
      <AnimatePresence>
        {bulkOperation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card p-6 rounded-lg border max-w-md w-full mx-4"
            >
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-5 h-5 text-yellow-500" />
                <h3 className="text-lg font-semibold">Confirm Bulk Operation</h3>
              </div>
              <p className="text-muted mb-6">
                Are you sure you want to {bulkOperation.type} {bulkOperation.targetIds.length} users?
                This action cannot be undone.
              </p>
              <div className="flex items-center gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setBulkOperation(null)}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={executeBulkOperation}
                  disabled={isProcessing}
                >
                  {isProcessing ? "Processing..." : "Confirm"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
