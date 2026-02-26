// admin/src/pages/Users.jsx
import React, { useState, useEffect, useCallback } from "react";
import { authAPI } from "../api";
import { useToast, useAuth } from "../App";

export default function Users() {
  const toast = useToast();
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [admins, setAdmins] = useState(new Set()); // track admin UIDs locally

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authAPI.getUsers(200);
      setUsers(res.users || []);
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleGrant = async (uid) => {
    if (!confirm("Grant admin access to this user?")) return;
    try {
      await authAPI.grantAdmin(uid);
      toast("Admin granted");
      setAdmins((prev) => new Set([...prev, uid]));
    } catch (err) {
      toast(err.message, "error");
    }
  };

  const handleRevoke = async (uid) => {
    if (!confirm("Revoke admin access?")) return;
    try {
      await authAPI.revokeAdmin(uid);
      toast("Admin revoked");
      setAdmins((prev) => { const s = new Set(prev); s.delete(uid); return s; });
    } catch (err) {
      toast(err.message, "error");
    }
  };

  if (loading) return <div className="spinner" />;

  return (
    <div>
      <div className="page-header">
        <h1>Users</h1>
        <p>View registered users and manage admin access</p>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>{users.length} registered users</h3>
          <button className="btn btn-ghost btn-sm" onClick={fetchUsers}>↻ Refresh</button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Joined</th>
                <th>Orders</th>
                <th>Spent</th>
                <th>Admin</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isMe = u.uid === me?.uid;
                return (
                  <tr key={u.uid}>
                    <td style={{ fontWeight: 600 }}>
                      {u.name || "—"}
                      {isMe && <span style={{ fontSize: 10, color: "var(--gold)", marginLeft: 6 }}>(you)</span>}
                    </td>
                    <td style={{ fontSize: 12 }}>{u.email}</td>
                    <td style={{ fontSize: 12 }}>{u.phone || "—"}</td>
                    <td style={{ fontSize: 11, color: "var(--text-dim)" }}>{u.createdAt?.slice(0, 10)}</td>
                    <td>{u.orderCount || 0}</td>
                    <td style={{ color: "var(--gold)" }}>₦{(u.totalSpent || 0).toLocaleString()}</td>
                    <td>
                      {isMe ? (
                        <span className="badge confirmed">admin</span>
                      ) : admins.has(u.uid) ? (
                        <button className="btn btn-red btn-sm" onClick={() => handleRevoke(u.uid)}>Revoke</button>
                      ) : (
                        <button className="btn btn-green btn-sm" onClick={() => handleGrant(u.uid)}>Grant</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!users.length && (
          <div className="empty-state"><div className="icon">👥</div><p>No users yet</p></div>
        )}
      </div>
    </div>
  );
}
