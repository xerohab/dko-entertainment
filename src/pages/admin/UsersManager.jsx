import { useState, useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { UserPlus, Shield, Edit2, Loader2, Mail, Check, X } from "lucide-react";

export default function UsersManager() {
  const { user } = useOutletContext();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("editor");
  const [inviting, setInviting] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [newRole, setNewRole] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.role !== "admin") { navigate("/admin"); return; }
    base44.entities.User.list("-created_date", 100).then(setUsers).finally(() => setLoading(false));
  }, []);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    await base44.users.inviteUser(inviteEmail.trim(), inviteRole);
    setInviteEmail("");
    setInviting(false);
    alert(`Invitation sent to ${inviteEmail.trim()} as ${inviteRole}`);
  };

  const handleRoleUpdate = async (u) => {
    setSaving(true);
    await base44.entities.User.update(u.id, { role: newRole });
    setUsers(prev => prev.map(usr => usr.id === u.id ? { ...usr, role: newRole } : usr));
    setEditingRole(null);
    setSaving(false);
  };

  const roleColor = (role) => {
    if (role === "admin") return "bg-primary/10 text-primary";
    if (role === "editor") return "bg-blue-500/10 text-blue-400";
    return "bg-secondary text-muted-foreground";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-oswald font-bold text-white text-3xl uppercase">Users</h1>
          <p className="text-muted-foreground font-inter text-sm mt-0.5">Manage admins and editors</p>
        </div>
      </div>

      {/* Invite Form */}
      <div className="bg-card border border-border rounded-xl p-6 mb-6">
        <h3 className="font-oswald font-bold text-white text-base uppercase mb-4 flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-primary" />
          Invite User
        </h3>
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              placeholder="email@example.com"
              className="w-full bg-secondary border border-border rounded pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
          </div>
          <select
            value={inviteRole}
            onChange={e => setInviteRole(e.target.value)}
            className="bg-secondary border border-border rounded px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary"
          >
            <option value="editor">Editor</option>
            <option value="admin">Admin</option>
          </select>
          <button
            onClick={handleInvite}
            disabled={inviting || !inviteEmail}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-oswald font-semibold text-sm tracking-wider uppercase rounded hover:bg-red-700 transition-colors disabled:opacity-40"
          >
            {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            Send Invite
          </button>
        </div>
      </div>

      {/* Users List */}
      {loading ? (
        <div className="flex justify-center py-24"><Loader2 className="w-10 h-10 text-primary animate-spin" /></div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-4 py-3 font-inter text-xs font-semibold text-muted-foreground uppercase tracking-wider">User</th>
                <th className="text-left px-4 py-3 font-inter text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</th>
                <th className="text-left px-4 py-3 font-inter text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
                <th className="text-right px-4 py-3 font-inter text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-oswald font-bold text-sm">
                        {u.full_name?.[0]?.toUpperCase() || "U"}
                      </div>
                      <span className="text-white font-inter text-sm">{u.full_name || "—"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground font-inter text-sm">{u.email}</td>
                  <td className="px-4 py-3">
                    {editingRole === u.id ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={newRole}
                          onChange={e => setNewRole(e.target.value)}
                          className="bg-secondary border border-primary rounded px-2 py-1 text-xs text-foreground focus:outline-none"
                        >
                          <option value="editor">Editor</option>
                          <option value="admin">Admin</option>
                          <option value="user">User</option>
                        </select>
                        <button onClick={() => handleRoleUpdate(u)} disabled={saving} className="p-1 text-green-400">
                          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => setEditingRole(null)} className="p-1 text-muted-foreground hover:text-white">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className={`text-xs font-inter font-medium px-2 py-0.5 rounded capitalize ${roleColor(u.role)}`}>
                        {u.role || "user"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      {editingRole !== u.id && (
                        <button
                          onClick={() => { setEditingRole(u.id); setNewRole(u.role || "user"); }}
                          className="p-1.5 text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}