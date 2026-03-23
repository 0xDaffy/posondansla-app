"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableWrap, Td, Th } from "@/components/ui/table";

type RoleKey = "chairman" | "treasurer" | "coordinator" | "sub";
type SectionKey = "dashboard" | "finance" | "expenses" | "tasks" | "reports" | "notifications" | "users" | "settings";
type TaskStatus = "pending" | "in_progress" | "completed";
type ExpenseStatus = "pending_main" | "pending_chairman" | "pending_treasurer" | "released" | "rejected";

type TaskItem = {
  title: string;
  assignedTo: string;
  deadline: string;
  status: TaskStatus;
  progress: number;
  createdBy: string;
  createdAt: string;
};

type RoleConfig = { name: string; permissions: string[]; sections: SectionKey[] };

type ExpenseItem = {
  category: string;
  description: string;
  requestedBy: string;
  requestedByRole: string;
  amount: number;
  requestedAt: string;
  status: ExpenseStatus;
  mainApprovedBy?: string;
  chairmanApprovedBy?: string;
  releasedBy?: string;
};

type Notice = { id: number; message: string; isRead: boolean; timestamp: string };
type Bill = {
  title: string;
  category: string;
  amount: number;
  proofNote: string;
  uploadedBy: string;
  uploadedByRole: string;
  createdAt: string;
  photoDataUrl?: string;
};

type TaskRequest = {
  title: string;
  requestedBy: string;
  deadline: string;
  priority: string;
  note: string;
  status: "pending" | "approved";
  createdAt: string;
};

const roles: Record<RoleKey, RoleConfig> = {
  chairman: {
    name: "Chairman",
    permissions: [
      "View all dashboards",
      "View financial reports",
      "Monitor tasks and progress",
      "Publish targeted announcements",
      "Approve expense requests",
      "Assign work to Main Coordinator"
    ],
    sections: ["dashboard", "tasks", "expenses", "reports", "notifications", "users", "settings"]
  },
  treasurer: {
    name: "Treasurer",
    permissions: ["Add funds", "Release approved expenses", "Upload bills", "Generate financial reports"],
    sections: ["dashboard", "finance", "expenses", "reports", "notifications", "settings"]
  },
  coordinator: {
    name: "Main Coordinator",
    permissions: [
      "Create tasks",
      "Assign tasks",
      "Request funds",
      "Update progress",
      "Add sub coordinators",
      "Send requests to Chairman",
      "Approve sub coordinator expenses"
    ],
    sections: ["dashboard", "tasks", "expenses", "notifications", "users", "settings"]
  },
  sub: {
    name: "Sub Coordinator",
    permissions: [
      "Review assigned tasks",
      "Maintain task progress",
      "Submit expense requests",
      "Upload bills",
      "Request tasks from coordinator"
    ],
    sections: ["dashboard", "tasks", "expenses", "notifications"]
  }
};

const sectionLabels: Record<SectionKey, string> = {
  dashboard: "Dashboard",
  finance: "Finance",
  expenses: "Expense Requests",
  tasks: "Tasks",
  reports: "Reports",
  notifications: "Notifications",
  users: "Users",
  settings: "Settings"
};

const money = new Intl.NumberFormat("en-LK", {
  style: "currency",
  currency: "LKR",
  maximumFractionDigits: 0
});

function nowStamp() {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}

const tourSteps = [
  "This app helps you manage donations, expenses, tasks, reports, and team coordination in one place.",
  "Switch role from top-right to preview Chairman, Treasurer, Main Coordinator, and named Sub Coordinators.",
  "Start by adding donations, tasks, expense requests, and bills to activate live reports.",
  "Use notifications, logs, and reports to track approvals and event progress in real time."
];

export function DashboardApp() {
  const [role, setRole] = useState<RoleKey>("treasurer");
  const [activeSubCoordinator, setActiveSubCoordinator] = useState("");
  const [activeSection, setActiveSection] = useState<SectionKey>(roles.treasurer.sections[0]);
  const [showTour, setShowTour] = useState(true);
  const [tourIndex, setTourIndex] = useState(0);

  const [funds, setFunds] = useState<Array<{ date: string; donor: string; source: string; amount: number; addedBy: string }>>([]);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [expenseLogs, setExpenseLogs] = useState<Array<{ when: string; category: string; action: string; by: string }>>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [taskLogs, setTaskLogs] = useState<Array<{ when: string; task: string; action: string; by: string }>>([]);
  const [taskRequests, setTaskRequests] = useState<TaskRequest[]>([]);
  const [notifications, setNotifications] = useState<Notice[]>([]);
  const [subCoordinators, setSubCoordinators] = useState<Array<{ name: string; contact: string; addedBy: string; addedAt: string }>>([]);
  const [chairmanRequests, setChairmanRequests] = useState<
    Array<{ subject: string; priority: string; message: string; createdBy: string; createdAt: string; status: "open" | "resolved" }>
  >([]);
  const [announcements, setAnnouncements] = useState<Array<{ title: string; message: string; visibility: "all" | "main_coordinator"; createdBy: string; createdAt: string }>>([]);
  const [bills, setBills] = useState<Bill[]>([]);

  const actorName = useMemo(() => {
    if (role === "sub" && activeSubCoordinator) return activeSubCoordinator;
    return roles[role].name;
  }, [role, activeSubCoordinator]);

  const allowedSections = roles[role].sections;

  const visibleTasks = useMemo(() => {
    if (role === "chairman" || role === "coordinator") return tasks;
    if (role === "sub") return tasks.filter((t) => t.createdBy === "Main Coordinator");
    return tasks.filter((t) => t.createdBy !== "Chairman");
  }, [tasks, role]);

  const totalFunds = useMemo(() => funds.reduce((sum, f) => sum + f.amount, 0), [funds]);
  const totalExpense = useMemo(() => expenses.filter((e) => e.status === "released").reduce((sum, e) => sum + e.amount, 0), [expenses]);
  const canViewFundAmount = role === "chairman" || role === "treasurer";

  const visibleBills = useMemo(() => {
    if (role === "chairman" || role === "treasurer") return bills;
    if (role === "coordinator") return bills.filter((b) => b.uploadedByRole === "Sub Coordinator");
    return bills.filter((b) => b.uploadedBy === actorName);
  }, [bills, role, actorName]);

  function pushNotice(message: string) {
    setNotifications((prev) => [{ id: Date.now(), message, isRead: false, timestamp: nowStamp().slice(0, 16) }, ...prev]);
  }

  function setRoleValue(value: string) {
    if (value.startsWith("sub::")) {
      setRole("sub");
      setActiveSubCoordinator(value.replace("sub::", ""));
      setActiveSection(roles.sub.sections[0]);
      return;
    }
    const key = value as RoleKey;
    setRole(key);
    setActiveSubCoordinator("");
    setActiveSection(roles[key].sections[0]);
  }

  function expenseMeta(status: ExpenseStatus) {
    if (status === "pending_main") return { label: "pending main coordinator", tone: "pending" as const };
    if (status === "pending_chairman") return { label: "pending chairman", tone: "pending" as const };
    if (status === "pending_treasurer") return { label: "pending treasurer", tone: "in_progress" as const };
    if (status === "released") return { label: "released", tone: "approved" as const };
    return { label: "rejected", tone: "rejected" as const };
  }

  const roleSelectValue = role === "sub" && activeSubCoordinator ? `sub::${activeSubCoordinator}` : role;

  return (
    <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
      <aside className="hidden h-screen border-r border-white/10 bg-gradient-to-b from-[#1f4538] to-[#0f2521] p-6 text-[#f8f5ef] lg:block">
        <h1 className="font-display text-xl font-bold">PosonDansla</h1>
        <p className="mt-1 text-sm text-[#cdd8d1]">Event Management System</p>
        <div className="mt-6 grid gap-2">
          {allowedSections.map((s) => (
            <button
              key={s}
              onClick={() => setActiveSection(s)}
              className={`rounded-xl px-3 py-2 text-left text-sm ${activeSection === s ? "bg-white/15" : "hover:bg-white/10"}`}
            >
              {sectionLabels[s]}
            </button>
          ))}
        </div>
      </aside>

      <main className="p-4 md:p-6">
        <header className="rounded-2xl border border-[#e6dbc8] bg-[#fffaf3cc] p-4 shadow-[0_12px_30px_rgba(58,42,18,0.09)] backdrop-blur">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold">Poson Dansala Project Hub</h2>
              <p className="text-sm text-[#6b625b]">Real-time planning, finance tracking, and volunteer coordination</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={roleSelectValue} onChange={(e) => setRoleValue(e.target.value)} className="w-[220px]">
                <option value="chairman">Chairman</option>
                <option value="treasurer">Treasurer</option>
                <option value="coordinator">Main Coordinator</option>
                {subCoordinators.map((sub) => (
                  <option key={sub.name} value={`sub::${sub.name}`}>
                    Sub Co - {sub.name}
                  </option>
                ))}
              </Select>
              <Button onClick={() => setActiveSection(allowedSections[0])}>+ Add Record</Button>
              <Button variant="secondary" onClick={() => { setShowTour(true); setTourIndex(0); }}>
                Guide
              </Button>
            </div>
          </div>

          <div className="mt-3 flex gap-2 overflow-auto lg:hidden">
            {allowedSections.map((s) => (
              <button
                key={s}
                onClick={() => setActiveSection(s)}
                className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-sm ${activeSection === s ? "bg-[#2f6d58] text-white" : "bg-white"}`}
              >
                {sectionLabels[s]}
              </button>
            ))}
          </div>
        </header>

        {activeSection === "dashboard" && (
          <section className="mt-4 space-y-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Card><p className="text-sm text-[#6b625b]">Total Funds</p><p className="mt-2 text-2xl font-extrabold">{money.format(totalFunds)}</p></Card>
              <Card><p className="text-sm text-[#6b625b]">Total Expenses</p><p className="mt-2 text-2xl font-extrabold">{money.format(totalExpense)}</p></Card>
              <Card>
                <p className="text-sm text-[#6b625b]">Remaining Balance</p>
                <p className="mt-2 text-2xl font-extrabold">{canViewFundAmount ? money.format(totalFunds - totalExpense) : "Restricted"}</p>
              </Card>
              <Card>
                <p className="text-sm text-[#6b625b]">Preparation Progress</p>
                <p className="mt-2 text-2xl font-extrabold">
                  {visibleTasks.length ? Math.round(visibleTasks.reduce((a, t) => a + t.progress, 0) / visibleTasks.length) : 0}%
                </p>
              </Card>
            </div>

            <div className="grid gap-3 xl:grid-cols-3">
              <Card className="xl:col-span-2">
                <h3 className="font-display text-base font-semibold">Task Progress Overview</h3>
                <div className="mt-3 space-y-3">
                  {!visibleTasks.length && <div className="rounded-xl border border-dashed p-3 text-sm text-[#6b625b]">No tasks visible for this role.</div>}
                  {visibleTasks.map((t) => (
                    <div key={`${t.title}-${t.createdAt}`}>
                      <div className="mb-1 flex items-center justify-between text-sm"><span>{t.title}</span><strong>{t.progress}%</strong></div>
                      <div className="h-2 overflow-hidden rounded-full bg-[#e7ddcf]"><span className="block h-full bg-gradient-to-r from-[#2f6d58] to-[#b45d2a]" style={{ width: `${t.progress}%` }} /></div>
                    </div>
                  ))}
                </div>
              </Card>
              <Card>
                <h3 className="font-display text-base font-semibold">Live Activity</h3>
                <div className="mt-3 space-y-2">
                  {!notifications.length && <div className="rounded-xl border border-dashed p-3 text-sm text-[#6b625b]">No live activity yet.</div>}
                  {notifications.slice(0, 6).map((n) => (
                    <div key={n.id} className={`rounded-xl border bg-white p-2 text-sm ${n.isRead ? "" : "border-l-4 border-l-[#b45d2a]"}`}>
                      <div>{n.message}</div>
                      <div className="text-xs text-[#6b625b]">{n.timestamp}</div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </section>
        )}

        {activeSection === "finance" && (
          <section className="mt-4 space-y-4">
            <div className="grid gap-3 lg:grid-cols-2">
              <Card>
                <h3 className="font-display text-base font-semibold">Add Donation</h3>
                <form
                  className="mt-3 grid gap-2 md:grid-cols-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    setFunds((prev) => [
                      ...prev,
                      {
                        donor: String(f.get("donor")),
                        source: String(f.get("source")),
                        amount: Number(f.get("amount")),
                        date: String(f.get("date")),
                        addedBy: actorName
                      }
                    ]);
                    pushNotice(`Donation added by ${actorName}`);
                    e.currentTarget.reset();
                  }}
                >
                  <Input name="donor" placeholder="Donor name" required />
                  <Input name="source" placeholder="Source" required />
                  <Input name="amount" type="number" min={1} placeholder="Amount" required />
                  <Input name="date" type="date" required />
                  <Textarea name="note" className="md:col-span-2" placeholder="Note" />
                  <Button className="md:col-span-2" type="submit">Save Donation</Button>
                </form>
              </Card>
              <Card>
                <h3 className="font-display text-base font-semibold">Fund Summary</h3>
                <div className="mt-3 space-y-2 text-sm">
                  {canViewFundAmount ? (
                    <>
                      <p>Total funds: <strong>{money.format(totalFunds)}</strong></p>
                      <p>Total expenses: <strong>{money.format(totalExpense)}</strong></p>
                      <p>Remaining balance: <strong>{money.format(totalFunds - totalExpense)}</strong></p>
                    </>
                  ) : (
                    <div className="rounded-xl border border-dashed p-3 text-[#6b625b]">Fund amount details are visible only to Chairman and Treasurer.</div>
                  )}
                </div>
              </Card>
            </div>
            <Card>
              <h3 className="font-display text-base font-semibold">Recent Donations</h3>
              <TableWrap className="mt-3">
                <Table>
                  <thead><tr><Th>Date</Th><Th>Donor</Th><Th>Source</Th><Th>Amount</Th><Th>Added By</Th></tr></thead>
                  <tbody>
                    {!funds.length && <tr><Td colSpan={5}><div className="rounded-xl border border-dashed p-3 text-center text-[#6b625b]">No donations yet.</div></Td></tr>}
                    {funds.slice().reverse().map((f, idx) => (
                      <tr key={`${f.date}-${idx}`}><Td>{f.date}</Td><Td>{f.donor}</Td><Td>{f.source}</Td><Td>{money.format(f.amount)}</Td><Td>{f.addedBy}</Td></tr>
                    ))}
                  </tbody>
                </Table>
              </TableWrap>
            </Card>
          </section>
        )}

        {activeSection === "expenses" && (
          <section className="mt-4 space-y-4">
            {(role === "coordinator" || role === "sub") && (
              <Card>
                <h3 className="font-display text-base font-semibold">Request Expense</h3>
                <form
                  className="mt-3 grid gap-2 md:grid-cols-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    const isMain = role === "coordinator";
                    const item: ExpenseItem = {
                      category: String(f.get("category")),
                      description: String(f.get("description")),
                      requestedBy: actorName,
                      requestedByRole: roles[role].name,
                      amount: Number(f.get("amount")),
                      requestedAt: nowStamp(),
                      status: isMain ? "pending_chairman" : "pending_main",
                      mainApprovedBy: isMain ? actorName : undefined
                    };
                    setExpenses((prev) => [...prev, item]);
                    setExpenseLogs((prev) => [...prev, { when: nowStamp(), category: item.category, action: "request submitted", by: actorName }]);
                    pushNotice(`Expense request submitted by ${actorName} (${item.category})`);
                    e.currentTarget.reset();
                  }}
                >
                  <Select name="category" required>
                    {["Drinks", "Food", "Ice", "Cups", "Equipment", "Decorations", "Transport", "Miscellaneous"].map((c) => <option key={c}>{c}</option>)}
                  </Select>
                  <Input name="amount" type="number" min={1} placeholder="Amount" required />
                  <Textarea className="md:col-span-2" name="description" placeholder="Expense purpose/details" required />
                  <Button className="md:col-span-2" type="submit">Submit Expense Request</Button>
                </form>
              </Card>
            )}

            <Card>
              <h3 className="font-display text-base font-semibold">Expense Requests</h3>
              <TableWrap className="mt-3">
                <Table>
                  <thead>
                    <tr><Th>Category</Th><Th>Description</Th><Th>Requested By</Th><Th>Requested At</Th><Th>Amount</Th><Th>Status</Th><Th>Action</Th></tr>
                  </thead>
                  <tbody>
                    {!expenses.length && <tr><Td colSpan={7}><div className="rounded-xl border border-dashed p-3 text-center text-[#6b625b]">No expense requests yet.</div></Td></tr>}
                    {expenses.map((e, i) => {
                      const meta = expenseMeta(e.status);
                      const canMain = role === "coordinator" && e.status === "pending_main";
                      const canChair = role === "chairman" && e.status === "pending_chairman";
                      const canTreasurer = role === "treasurer" && e.status === "pending_treasurer";
                      return (
                        <tr key={`${e.requestedAt}-${i}`}>
                          <Td>{e.category}</Td>
                          <Td>{e.description}</Td>
                          <Td>{e.requestedBy}</Td>
                          <Td>{e.requestedAt}</Td>
                          <Td>{money.format(e.amount)}</Td>
                          <Td><Badge tone={meta.tone}>{meta.label}</Badge></Td>
                          <Td className="space-x-2">
                            {canMain && (
                              <>
                                <Button size="sm" onClick={() => {
                                  setExpenses((prev) => prev.map((x, idx) => idx === i ? { ...x, status: "pending_chairman", mainApprovedBy: actorName } : x));
                                  setExpenseLogs((p) => [...p, { when: nowStamp(), category: e.category, action: "main approve", by: actorName }]);
                                  pushNotice(`Expense ${e.category} moved to Chairman approval`);
                                }}>Main Approve</Button>
                                <Button variant="secondary" size="sm" onClick={() => {
                                  setExpenses((prev) => prev.map((x, idx) => idx === i ? { ...x, status: "rejected" } : x));
                                  setExpenseLogs((p) => [...p, { when: nowStamp(), category: e.category, action: "rejected", by: actorName }]);
                                  pushNotice(`Expense ${e.category} rejected`);
                                }}>Reject</Button>
                              </>
                            )}
                            {canChair && (
                              <>
                                <Button size="sm" onClick={() => {
                                  setExpenses((prev) => prev.map((x, idx) => idx === i ? { ...x, status: "pending_treasurer", chairmanApprovedBy: actorName } : x));
                                  setExpenseLogs((p) => [...p, { when: nowStamp(), category: e.category, action: "chairman approve", by: actorName }]);
                                  pushNotice(`Expense ${e.category} moved to Treasurer release`);
                                }}>Chairman Approve</Button>
                                <Button variant="secondary" size="sm" onClick={() => {
                                  setExpenses((prev) => prev.map((x, idx) => idx === i ? { ...x, status: "rejected" } : x));
                                  setExpenseLogs((p) => [...p, { when: nowStamp(), category: e.category, action: "rejected", by: actorName }]);
                                  pushNotice(`Expense ${e.category} rejected`);
                                }}>Reject</Button>
                              </>
                            )}
                            {canTreasurer && (
                              <>
                                <Button size="sm" onClick={() => {
                                  setExpenses((prev) => prev.map((x, idx) => idx === i ? { ...x, status: "released", releasedBy: actorName } : x));
                                  setExpenseLogs((p) => [...p, { when: nowStamp(), category: e.category, action: "accept & release", by: actorName }]);
                                  pushNotice(`Expense ${e.category} accepted and released by Treasurer`);
                                }}>Accept & Release</Button>
                                <Button variant="secondary" size="sm" onClick={() => {
                                  setExpenses((prev) => prev.map((x, idx) => idx === i ? { ...x, status: "rejected" } : x));
                                  setExpenseLogs((p) => [...p, { when: nowStamp(), category: e.category, action: "rejected", by: actorName }]);
                                  pushNotice(`Expense ${e.category} rejected`);
                                }}>Reject</Button>
                              </>
                            )}
                            {!canMain && !canChair && !canTreasurer && <span className="text-xs text-[#6b625b]">View only</span>}
                          </Td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </TableWrap>
            </Card>

            <div className="grid gap-3 lg:grid-cols-2">
              <Card>
                <h3 className="font-display text-base font-semibold">Bill Upload</h3>
                <form
                  className="mt-3 grid gap-2 md:grid-cols-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    const file = f.get("photo") as File | null;
                    const baseBill: Bill = {
                      title: String(f.get("title")),
                      category: String(f.get("category")),
                      amount: Number(f.get("amount")),
                      proofNote: String(f.get("proofNote")),
                      uploadedBy: actorName,
                      uploadedByRole: roles[role].name,
                      createdAt: nowStamp()
                    };

                    const save = (photoDataUrl?: string) => {
                      setBills((prev) => [...prev, { ...baseBill, photoDataUrl }]);
                      pushNotice(`Bill uploaded: ${baseBill.title} by ${baseBill.uploadedBy}`);
                      e.currentTarget.reset();
                    };

                    if (file && file.size > 0) {
                      const reader = new FileReader();
                      reader.onload = () => save(String(reader.result || ""));
                      reader.readAsDataURL(file);
                      return;
                    }
                    save();
                  }}
                >
                  <Input name="title" placeholder="Bill title" required />
                  <Select name="category" required>
                    {["Drinks", "Food", "Ice", "Cups", "Equipment", "Decorations", "Transport", "Miscellaneous"].map((c) => <option key={c}>{c}</option>)}
                  </Select>
                  <Input name="amount" type="number" min={1} placeholder="Amount" required />
                  <Input name="photo" type="file" accept="image/*" />
                  <Textarea className="md:col-span-2" name="proofNote" placeholder="Written proof / bill details" required />
                  <Button className="md:col-span-2" type="submit">Upload Bill</Button>
                </form>
              </Card>

              <Card>
                <h3 className="font-display text-base font-semibold">Bills</h3>
                <TableWrap className="mt-3">
                  <Table>
                    <thead><tr><Th>When</Th><Th>Title</Th><Th>Amount</Th><Th>Uploaded By</Th><Th>Proof</Th></tr></thead>
                    <tbody>
                      {!visibleBills.length && <tr><Td colSpan={5}><div className="rounded-xl border border-dashed p-3 text-center text-[#6b625b]">No bills visible for this role.</div></Td></tr>}
                      {visibleBills.slice().reverse().map((b, i) => (
                        <tr key={`${b.createdAt}-${i}`}>
                          <Td>{b.createdAt}</Td>
                          <Td>{b.title}</Td>
                          <Td>{money.format(b.amount)}</Td>
                          <Td>{b.uploadedBy} ({b.uploadedByRole})</Td>
                          <Td>
                            <div className="text-xs text-[#6b625b]">{b.proofNote}</div>
                            {b.photoDataUrl ? (
                              (role === "chairman" || role === "treasurer") ? (
                                <a href={b.photoDataUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs font-semibold text-[#2f6d58]">View Photo</a>
                              ) : (
                                <span className="text-xs text-[#6b625b]">Photo restricted</span>
                              )
                            ) : (
                              <span className="text-xs text-[#6b625b]">No photo</span>
                            )}
                          </Td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </TableWrap>
              </Card>
            </div>

            <Card>
              <h3 className="font-display text-base font-semibold">Expense Action Logs</h3>
              <TableWrap className="mt-3">
                <Table>
                  <thead><tr><Th>When</Th><Th>Category</Th><Th>Action</Th><Th>By</Th></tr></thead>
                  <tbody>
                    {!expenseLogs.length && <tr><Td colSpan={4}><div className="rounded-xl border border-dashed p-3 text-center text-[#6b625b]">No expense logs yet.</div></Td></tr>}
                    {expenseLogs.slice().reverse().map((l, i) => (
                      <tr key={`${l.when}-${i}`}><Td>{l.when}</Td><Td>{l.category}</Td><Td>{l.action}</Td><Td>{l.by}</Td></tr>
                    ))}
                  </tbody>
                </Table>
              </TableWrap>
            </Card>
          </section>
        )}

        {activeSection === "tasks" && (
          <section className="mt-4 space-y-4">
            <div className="grid gap-3 lg:grid-cols-2">
              <Card>
                <h3 className="font-display text-base font-semibold">Create Task</h3>
                <form
                  className="mt-3 grid gap-2 md:grid-cols-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    const assignedTo = role === "chairman" ? "Main Coordinator" : String(f.get("assigned"));
                    const status = String(f.get("status")) as TaskStatus;
                    const task: TaskItem = {
                      title: String(f.get("title")),
                      assignedTo,
                      deadline: String(f.get("deadline")),
                      status,
                      progress: status === "completed" ? 100 : status === "in_progress" ? 50 : 5,
                      createdBy: actorName,
                      createdAt: nowStamp()
                    };
                    setTasks((prev) => [...prev, task]);
                    setTaskLogs((prev) => [...prev, { when: nowStamp(), task: task.title, action: "task created", by: actorName }]);
                    pushNotice(`Task assigned: ${task.title}`);
                    e.currentTarget.reset();
                  }}
                >
                  <Input name="title" placeholder="Task title" required />
                  <Input name="assigned" placeholder="Assigned to" readOnly={role === "chairman"} defaultValue={role === "chairman" ? "Main Coordinator" : ""} required />
                  <Input name="deadline" type="date" required />
                  <Select name="status" defaultValue="pending"><option value="pending">pending</option><option value="in_progress">in_progress</option><option value="completed">completed</option></Select>
                  <Textarea className="md:col-span-2" name="description" placeholder="Description" />
                  <Button className="md:col-span-2" type="submit">Create Task</Button>
                </form>
              </Card>

              <Card>
                <h3 className="font-display text-base font-semibold">Task Completion</h3>
                <div className="mt-3 space-y-2 text-sm">
                  <p>Completed: <strong>{visibleTasks.filter((t) => t.status === "completed").length}</strong></p>
                  <p>In Progress: <strong>{visibleTasks.filter((t) => t.status === "in_progress").length}</strong></p>
                  <p>Pending: <strong>{visibleTasks.filter((t) => t.status === "pending").length}</strong></p>
                </div>
              </Card>
            </div>

            {role === "sub" && (
              <Card>
                <h3 className="font-display text-base font-semibold">Sub Coordinator Task Request</h3>
                <form
                  className="mt-3 grid gap-2 md:grid-cols-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    const req: TaskRequest = {
                      title: String(f.get("title")),
                      requestedBy: actorName,
                      deadline: String(f.get("deadline")),
                      priority: String(f.get("priority")),
                      note: String(f.get("note")),
                      status: "pending",
                      createdAt: nowStamp()
                    };
                    setTaskRequests((prev) => [...prev, req]);
                    setTaskLogs((prev) => [...prev, { when: nowStamp(), task: req.title, action: "task requested by sub coordinator", by: actorName }]);
                    pushNotice(`New task request: ${req.title} (${req.requestedBy})`);
                    e.currentTarget.reset();
                  }}
                >
                  <Input name="title" placeholder="Requested task title" required />
                  <Input value={actorName} readOnly />
                  <Input name="deadline" type="date" required />
                  <Select name="priority"><option>low</option><option>medium</option><option>high</option></Select>
                  <Textarea className="md:col-span-2" name="note" placeholder="Task request details" />
                  <Button className="md:col-span-2" type="submit">Submit Task Request</Button>
                </form>
              </Card>
            )}

            {role === "coordinator" && (
              <Card>
                <h3 className="font-display text-base font-semibold">Task Requests</h3>
                <TableWrap className="mt-3">
                  <Table>
                    <thead><tr><Th>Title</Th><Th>Requested By</Th><Th>Deadline</Th><Th>Priority</Th><Th>Status</Th><Th>Action</Th></tr></thead>
                    <tbody>
                      {!taskRequests.length && <tr><Td colSpan={6}><div className="rounded-xl border border-dashed p-3 text-center text-[#6b625b]">No task requests yet.</div></Td></tr>}
                      {taskRequests.map((r, i) => (
                        <tr key={`${r.title}-${i}`}>
                          <Td>{r.title}</Td><Td>{r.requestedBy}</Td><Td>{r.deadline}</Td><Td>{r.priority}</Td><Td><Badge tone={r.status === "approved" ? "approved" : "pending"}>{r.status}</Badge></Td>
                          <Td>
                            {r.status === "pending" ? (
                              <Button size="sm" onClick={() => {
                                setTaskRequests((prev) => prev.map((x, idx) => idx === i ? { ...x, status: "approved" } : x));
                                const task: TaskItem = {
                                  title: r.title,
                                  assignedTo: r.requestedBy,
                                  deadline: r.deadline,
                                  status: "pending",
                                  progress: 0,
                                  createdBy: actorName,
                                  createdAt: nowStamp()
                                };
                                setTasks((prev) => [...prev, task]);
                                setTaskLogs((prev) => [...prev, { when: nowStamp(), task: r.title, action: "task request approved and assigned", by: actorName }]);
                                pushNotice(`Task request approved: ${r.title}`);
                              }}>Assign as Task</Button>
                            ) : (
                              <span className="text-xs text-[#6b625b]">-</span>
                            )}
                          </Td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </TableWrap>
              </Card>
            )}

            <Card>
              <h3 className="font-display text-base font-semibold">All Tasks</h3>
              <TableWrap className="mt-3">
                <Table>
                  <thead><tr><Th>Title</Th><Th>Assigned To</Th><Th>Deadline</Th><Th>Status</Th><Th>Progress</Th><Th>Created By</Th><Th>Created At</Th><Th>Update</Th></tr></thead>
                  <tbody>
                    {!visibleTasks.length && <tr><Td colSpan={8}><div className="rounded-xl border border-dashed p-3 text-center text-[#6b625b]">No tasks visible for this role.</div></Td></tr>}
                    {visibleTasks.map((t, i) => (
                      <tr key={`${t.title}-${i}`}>
                        <Td>{t.title}</Td><Td>{t.assignedTo}</Td><Td>{t.deadline}</Td><Td><Badge tone={t.status === "completed" ? "approved" : t.status === "in_progress" ? "in_progress" : "pending"}>{t.status}</Badge></Td>
                        <Td>{t.progress}%</Td><Td>{t.createdBy}</Td><Td>{t.createdAt}</Td>
                        <Td>
                          {(role === "coordinator" || role === "sub") ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min={0}
                                max={100}
                                defaultValue={t.progress}
                                className="h-8 w-20"
                                onBlur={(e) => {
                                  const v = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                                  setTasks((prev) => prev.map((x) => x === t ? { ...x, progress: v, status: v >= 100 ? "completed" : v > 0 ? "in_progress" : "pending" } : x));
                                  setTaskLogs((prev) => [...prev, { when: nowStamp(), task: t.title, action: `progress updated to ${v}%`, by: actorName }]);
                                }}
                              />
                            </div>
                          ) : (
                            <span className="text-xs text-[#6b625b]">View only</span>
                          )}
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </TableWrap>
            </Card>

            <Card>
              <h3 className="font-display text-base font-semibold">Task Activity Logs</h3>
              <TableWrap className="mt-3">
                <Table>
                  <thead><tr><Th>When</Th><Th>Task</Th><Th>Action</Th><Th>By</Th></tr></thead>
                  <tbody>
                    {!taskLogs.length && <tr><Td colSpan={4}><div className="rounded-xl border border-dashed p-3 text-center text-[#6b625b]">No task logs yet.</div></Td></tr>}
                    {taskLogs.slice().reverse().map((l, i) => <tr key={`${l.when}-${i}`}><Td>{l.when}</Td><Td>{l.task}</Td><Td>{l.action}</Td><Td>{l.by}</Td></tr>)}
                  </tbody>
                </Table>
              </TableWrap>
            </Card>
          </section>
        )}

        {activeSection === "reports" && (
          <section className="mt-4 space-y-4">
            <div className="grid gap-3 lg:grid-cols-2">
              <Card>
                <h3 className="font-display text-base font-semibold">Financial Report</h3>
                <div className="mt-3 space-y-2 text-sm">
                  {canViewFundAmount ? (
                    <>
                      <p>Total donations: <strong>{money.format(totalFunds)}</strong></p>
                      <p>Total expenses: <strong>{money.format(totalExpense)}</strong></p>
                      <p>Remaining balance: <strong>{money.format(totalFunds - totalExpense)}</strong></p>
                    </>
                  ) : (
                    <div className="rounded-xl border border-dashed p-3 text-[#6b625b]">Financial amounts are restricted for this role.</div>
                  )}
                </div>
                <div className="mt-3 flex gap-2"><Button>Export CSV</Button><Button variant="secondary">Export PDF</Button></div>
              </Card>
              <Card>
                <h3 className="font-display text-base font-semibold">Task Report</h3>
                <div className="mt-3 space-y-2 text-sm">
                  <p>Completed tasks: <strong>{tasks.filter((t) => t.status === "completed").length}</strong></p>
                  <p>Pending tasks: <strong>{tasks.filter((t) => t.status !== "completed").length}</strong></p>
                </div>
              </Card>
            </div>
          </section>
        )}

        {activeSection === "notifications" && (
          <section className="mt-4 space-y-4">
            <Card>
              <h3 className="font-display text-base font-semibold">Notifications</h3>
              <div className="mt-3 space-y-2">
                {!notifications.length && <div className="rounded-xl border border-dashed p-3 text-sm text-[#6b625b]">No notifications yet.</div>}
                {notifications.map((n) => (
                  <div key={n.id} className={`flex items-center justify-between rounded-xl border bg-white p-2 ${n.isRead ? "" : "border-l-4 border-l-[#b45d2a]"}`}>
                    <div>
                      <div className="text-sm">{n.message}</div>
                      <small className="text-xs text-[#6b625b]">{n.timestamp}</small>
                    </div>
                    <Button size="sm" onClick={() => setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, isRead: true } : x))}>
                      {n.isRead ? "Read" : "Mark Read"}
                    </Button>
                  </div>
                ))}
              </div>
            </Card>

            {(role === "coordinator" || role === "chairman") && (
              <div className="grid gap-3 lg:grid-cols-2">
                {role === "coordinator" && (
                  <Card>
                    <h3 className="font-display text-base font-semibold">Main Coordinator Request to Chairman</h3>
                    <form className="mt-3 grid gap-2" onSubmit={(e) => {
                      e.preventDefault();
                      const f = new FormData(e.currentTarget);
                      setChairmanRequests((prev) => [...prev, {
                        subject: String(f.get("subject")),
                        priority: String(f.get("priority")),
                        message: String(f.get("message")),
                        createdBy: actorName,
                        createdAt: nowStamp(),
                        status: "open"
                      }]);
                      pushNotice(`New request sent to Chairman: ${String(f.get("subject"))}`);
                      e.currentTarget.reset();
                    }}>
                      <Input name="subject" placeholder="Request subject" required />
                      <Select name="priority"><option>low</option><option>medium</option><option>high</option></Select>
                      <Textarea name="message" placeholder="Request details" required />
                      <Button type="submit">Send Request</Button>
                    </form>
                  </Card>
                )}

                {role === "chairman" && (
                  <Card>
                    <h3 className="font-display text-base font-semibold">Chairman Announcements</h3>
                    <form className="mt-3 grid gap-2" onSubmit={(e) => {
                      e.preventDefault();
                      const f = new FormData(e.currentTarget);
                      setAnnouncements((prev) => [...prev, {
                        title: String(f.get("title")),
                        message: String(f.get("message")),
                        visibility: String(f.get("visibility")) as "all" | "main_coordinator",
                        createdBy: actorName,
                        createdAt: nowStamp()
                      }]);
                      pushNotice(`Chairman published announcement: ${String(f.get("title"))}`);
                      e.currentTarget.reset();
                    }}>
                      <Input name="title" placeholder="Announcement title" required />
                      <Select name="visibility"><option value="all">Visible to all users</option><option value="main_coordinator">Visible only to Main Coordinator</option></Select>
                      <Textarea name="message" placeholder="Announcement message" required />
                      <Button type="submit">Publish Announcement</Button>
                    </form>
                  </Card>
                )}
              </div>
            )}

            <Card>
              <h3 className="font-display text-base font-semibold">Announcement Feed</h3>
              <div className="mt-3 space-y-2">
                {announcements
                  .filter((a) => a.visibility === "all" || role === "coordinator")
                  .slice()
                  .reverse()
                  .map((a, i) => (
                    <div key={`${a.title}-${i}`} className="rounded-xl border bg-white p-2">
                      <div className="font-semibold">{a.title}</div>
                      <div className="text-sm">{a.message}</div>
                      <div className="text-xs text-[#6b625b]">{a.createdAt} - {a.visibility === "all" ? "All users" : "Main Coordinator only"}</div>
                    </div>
                  ))}
                {!announcements.length && <div className="rounded-xl border border-dashed p-3 text-sm text-[#6b625b]">No announcements available for this role.</div>}
              </div>
            </Card>

            {role === "chairman" && (
              <Card>
                <h3 className="font-display text-base font-semibold">Coordinator Requests Inbox</h3>
                <TableWrap className="mt-3">
                  <Table>
                    <thead><tr><Th>When</Th><Th>Subject</Th><Th>Priority</Th><Th>Message</Th><Th>Status</Th><Th>Action</Th></tr></thead>
                    <tbody>
                      {!chairmanRequests.length && <tr><Td colSpan={6}><div className="rounded-xl border border-dashed p-3 text-center text-[#6b625b]">No coordinator requests yet.</div></Td></tr>}
                      {chairmanRequests.slice().reverse().map((r, i) => (
                        <tr key={`${r.createdAt}-${i}`}>
                          <Td>{r.createdAt}</Td><Td>{r.subject}</Td><Td>{r.priority}</Td><Td>{r.message}</Td><Td><Badge tone={r.status === "open" ? "pending" : "approved"}>{r.status}</Badge></Td>
                          <Td>{r.status === "open" ? <Button size="sm" onClick={() => {
                            const revIndex = chairmanRequests.length - 1 - i;
                            setChairmanRequests((prev) => prev.map((x, idx) => idx === revIndex ? { ...x, status: "resolved" } : x));
                            pushNotice(`Chairman resolved request: ${r.subject}`);
                          }}>Mark Resolved</Button> : <span className="text-xs text-[#6b625b]">-</span>}</Td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </TableWrap>
              </Card>
            )}
          </section>
        )}

        {activeSection === "users" && (
          <section className="mt-4 space-y-4">
            <Card>
              <h3 className="font-display text-base font-semibold">Role Permissions</h3>
              <TableWrap className="mt-3">
                <Table>
                  <thead><tr><Th>Role</Th><Th>Permissions</Th></tr></thead>
                  <tbody>{Object.values(roles).map((r) => <tr key={r.name}><Td>{r.name}</Td><Td>{r.permissions.join(", ")}</Td></tr>)}</tbody>
                </Table>
              </TableWrap>
            </Card>

            <div className="grid gap-3 lg:grid-cols-2">
              <Card>
                <h3 className="font-display text-base font-semibold">Add Sub Coordinator</h3>
                <form
                  className="mt-3 grid gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (role !== "coordinator") return;
                    const f = new FormData(e.currentTarget);
                    setSubCoordinators((prev) => [...prev, { name: String(f.get("name")), contact: String(f.get("contact")), addedBy: actorName, addedAt: nowStamp() }]);
                    pushNotice(`Sub Coordinator added: ${String(f.get("name"))}`);
                    e.currentTarget.reset();
                  }}
                >
                  <Input name="name" placeholder="Sub Coordinator name" required disabled={role !== "coordinator"} />
                  <Input name="contact" placeholder="Phone/Email" required disabled={role !== "coordinator"} />
                  <Button type="submit" disabled={role !== "coordinator"}>Add Sub Coordinator</Button>
                </form>
              </Card>
              <Card>
                <h3 className="font-display text-base font-semibold">Sub Coordinator List</h3>
                <TableWrap className="mt-3">
                  <Table>
                    <thead><tr><Th>Name</Th><Th>Contact</Th><Th>Added By</Th><Th>Added At</Th></tr></thead>
                    <tbody>
                      {!subCoordinators.length && <tr><Td colSpan={4}><div className="rounded-xl border border-dashed p-3 text-center text-[#6b625b]">No Sub Coordinators added yet.</div></Td></tr>}
                      {subCoordinators.slice().reverse().map((s, i) => <tr key={`${s.name}-${i}`}><Td>{s.name}</Td><Td>{s.contact}</Td><Td>{s.addedBy}</Td><Td>{s.addedAt}</Td></tr>)}
                    </tbody>
                  </Table>
                </TableWrap>
              </Card>
            </div>
          </section>
        )}

        {activeSection === "settings" && (
          <section className="mt-4 grid gap-3 lg:grid-cols-2">
            <Card>
              <h3 className="font-display text-base font-semibold">System Settings</h3>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                <Input defaultValue="PosonDansla Event" />
                <Input defaultValue="Asia/Colombo" />
                <Select><option>Supabase</option><option>Firebase</option></Select>
                <Select><option>English</option><option>Sinhala</option></Select>
                <Button className="md:col-span-2">Save Settings</Button>
              </div>
            </Card>
            <Card>
              <h3 className="font-display text-base font-semibold">Security Checklist</h3>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[#6b625b]">
                <li>Role-based access control</li>
                <li>Protected routes and secure authentication</li>
                <li>Input validation for amount/date and uploads</li>
                <li>Audit logs for task and expense workflows</li>
              </ul>
            </Card>
          </section>
        )}
      </main>

      {showTour && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#091210]/60 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-[#e6dbc8] bg-[#fffaf3] p-5 shadow-[0_12px_30px_rgba(58,42,18,0.09)]">
            <h3 className="font-display text-lg font-semibold">Welcome to PosonDansla</h3>
            <p className="mt-1 text-xs text-[#6b625b]">Step {tourIndex + 1} of {tourSteps.length}</p>
            <p className="mt-3 text-sm">{tourSteps[tourIndex]}</p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowTour(false)}>Skip</Button>
              <Button variant="outline" onClick={() => setTourIndex((n) => Math.max(0, n - 1))} disabled={tourIndex === 0}>Back</Button>
              <Button onClick={() => {
                if (tourIndex < tourSteps.length - 1) {
                  setTourIndex((n) => n + 1);
                  return;
                }
                setShowTour(false);
              }}>{tourIndex === tourSteps.length - 1 ? "Finish" : "Next"}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
