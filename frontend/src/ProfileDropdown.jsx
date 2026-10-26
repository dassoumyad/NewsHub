import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bookmark, ChevronDown, LogOut, UserRound } from "lucide-react";

export default function ProfileDropdown({ user }) {
  const [open, setOpen] = useState(false); const navigate = useNavigate(); const name = user?.name || user?.email?.split("@")[0] || "Reader";
  function logout() { localStorage.removeItem("token"); localStorage.removeItem("user"); window.dispatchEvent(new Event("newshub-auth")); setOpen(false); navigate("/"); }
  return <div className="profile-wrap"><button className="profile-trigger" onClick={() => setOpen(!open)}><span className="profile-avatar">{name.slice(0,1).toUpperCase()}</span><span className="profile-name">{name.split(" ")[0]}</span><ChevronDown size={14} /></button>{open && <><button className="dropdown-dismiss" aria-label="Close profile menu" onClick={() => setOpen(false)} /><div className="profile-menu"><div className="profile-menu-user"><span className="profile-avatar">{name.slice(0,1).toUpperCase()}</span><span><strong>{name}</strong><small>{user?.email}</small></span></div><Link to="/saved" onClick={() => setOpen(false)}><Bookmark size={15} /> Saved stories</Link><Link to="/" onClick={() => setOpen(false)}><UserRound size={15} /> Your newsroom</Link><button onClick={logout}><LogOut size={15} /> Sign out</button></div></>}</div>;
}
