import React, { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// --------------------
// Supabase setup
// --------------------
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --------------------
// Helpers
// --------------------
const STATUS = ["Not Started", "In Progress", "Blocked", "Done"];
const PRIORITY = ["High", "Medium", "Low"];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// --------------------
// App
// --------------------
export default function App() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    project: "",
    area: "",
    status: "Not Started",
    next_action: "",
    due_date: "",
    priority: "Medium",
    notes: ""
  });

  // --------------------
  // Auth
  // --------------------
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  async function signIn() {
    await supabase.auth.signInWithPassword({ email, password });
  }

  async function signUp() {
    await supabase.auth.signUp({ email, password });
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  // --------------------
  // Data
  // --------------------
  async function loadProjects() {
    setLoading(true);
    const { data } = await supabase
      .from("projects")
      .select("*")
      .order("due_date", { ascending: true });
    setProjects(data || []);
    setLoading(false);
  }

  async function addProject(e) {
    e.preventDefault();
    await supabase.from("projects").insert({
      ...form,
      user_id: session.user.id
    });
    setForm({
      project: "",
      area: "",
      status: "Not Started",
      next_action: "",
      due_date: "",
      priority: "Medium",
      notes: ""
    });
    loadProjects();
  }

  async function deleteProject(id) {
    await supabase.from("projects").delete().eq("id", id);
    loadProjects();
  }

  useEffect(() => {
    if (session) loadProjects();
  }, [session]);

  // --------------------
  // UI
  // --------------------
  if (!session) {
    return (
      <div style={{ maxWidth: 400, margin: "80px auto" }}>
        <h2>Task Management Project</h2>
        <input
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ width: "100%", marginBottom: 8 }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{ width: "100%", marginBottom: 8 }}
        />
        <button onClick={signIn} style={{ marginRight: 8 }}>
          Sign In
        </button>
        <button onClick={signUp}>Sign Up</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1000, margin: "40px auto" }}>
      <h2>Task Management Project</h2>
      <button onClick={signOut}>Sign Out</button>

      <form onSubmit={addProject} style={{ marginTop: 20 }}>
        <h3>Add Project</h3>
        <input
          placeholder="Project"
          value={form.project}
          onChange={e => setForm({ ...form, project: e.target.value })}
          required
        />
        <input
          placeholder="Area"
          value={form.area}
          onChange={e => setForm({ ...form, area: e.target.value })}
        />
        <input
          placeholder="Next Action"
          value={form.next_action}
          onChange={e => setForm({ ...form, next_action: e.target.value })}
        />
        <input
          type="date"
          value={form.due_date}
          onChange={e => setForm({ ...form, due_date: e.target.value })}
        />
        <select
          value={form.status}
          onChange={e => setForm({ ...form, status: e.target.value })}
        >
          {STATUS.map(s => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select
          value={form.priority}
          onChange={e => setForm({ ...form, priority: e.target.value })}
        >
          {PRIORITY.map(p => (
            <option key={p}>{p}</option>
          ))}
        </select>
        <textarea
          placeholder="Notes"
          value={form.notes}
          onChange={e => setForm({ ...form, notes: e.target.value })}
        />
        <br />
        <button type="submit">Add</button>
      </form>

      <h3 style={{ marginTop: 40 }}>Projects</h3>
      {loading ? (
        <p>Loading…</p>
      ) : (
        <table border="1" cellPadding="6" style={{ width: "100%" }}>
          <thead>
            <tr>
              <th>Project</th>
              <th>Area</th>
              <th>Status</th>
              <th>Next Action</th>
              <th>Due</th>
              <th>Priority</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {projects.map(p => (
              <tr key={p.id}>
                <td>{p.project}</td>
                <td>{p.area}</td>
                <td>{p.status}</td>
                <td>{p.next_action}</td>
                <td>{p.due_date}</td>
                <td>{p.priority}</td>
                <td>
                  <button onClick={() => deleteProject(p.id)}>X</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
