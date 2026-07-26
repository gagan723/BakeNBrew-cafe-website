import { useContext, useEffect, useMemo, useState } from "react";
import { FiCalendar, FiMail, FiPackage, FiShield, FiUser } from "react-icons/fi";
import { Link } from "react-router-dom";
import { UserContext } from "../../context/UserContext";
import axiosInstance from "../utils/axiosInstance";

const formatDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short",
  });
};

function LoadingCards() {
  return <div className="space-y-3" aria-label="Loading account history">{[1, 2, 3].map((item) => (
    <div key={item} className="animate-pulse rounded-2xl border border-border bg-white p-5">
      <div className="h-4 w-2/5 rounded bg-stone-200" />
      <div className="mt-3 h-3 w-4/5 rounded bg-stone-100" />
      <div className="mt-4 h-7 w-24 rounded-full bg-orange-50" />
    </div>
  ))}</div>;
}

function EmptyState({ type }) {
  const isReservation = type === "reservations";
  return (
    <div className="rounded-3xl border border-dashed border-orange-200 bg-orange-50/50 px-6 py-12 text-center">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-white text-xl text-primary shadow-sm">
        {isReservation ? <FiCalendar /> : <FiPackage />}
      </span>
      <h3 className="mt-4 font-Source text-lg font-semibold text-text">{isReservation ? "No reservations yet" : "No previous orders"}</h3>
      <p className="mx-auto mt-1 max-w-sm font-Source text-sm text-secondary">
        {isReservation ? "Book a table and its details will appear here." : "Explore the menu and your completed orders will appear here."}
      </p>
      <Link to={isReservation ? "/reservation" : "/order"} className="mt-5 inline-flex rounded-full bg-primary px-5 py-2.5 font-Source text-sm font-semibold text-white transition hover:bg-[#d97435]">
        {isReservation ? "Reserve a table" : "Browse the menu"}
      </Link>
    </div>
  );
}

export default function Profile({ setShowLogin }) {
  const { user } = useContext(UserContext);
  const [activeTab, setActiveTab] = useState("reservations");
  const [reservations, setReservations] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const initials = useMemo(() => user?.name?.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "BB", [user]);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    Promise.all([axiosInstance.get("/api/reservations/me"), axiosInstance.get("/api/orders/me")])
      .then(([reservationResponse, orderResponse]) => {
        setReservations(reservationResponse.data.reservations || []);
        setOrders(orderResponse.data.orders || []);
      })
      .catch((requestError) => setError(requestError.response?.data?.message || "Could not load your profile history."))
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) {
    return (
      <main className="mx-auto grid min-h-[58vh] max-w-6xl place-items-center px-5 py-20 text-center">
        <div>
          <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-orange-100 text-3xl text-primary"><FiUser /></span>
          <h1 className="mt-5 font-Bebas text-5xl tracking-wide text-text">Your profile</h1>
          <p className="mt-2 font-Source text-secondary">Log in to view your account, reservations and orders.</p>
          <button onClick={() => setShowLogin(true)} className="mt-6 rounded-full bg-primary px-7 py-3 font-Source font-semibold text-white">Log in</button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[65vh] bg-gradient-to-b from-[#fffaf6] to-[#f9f6f4] px-5 py-10 sm:py-14 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="font-Source text-xs font-semibold uppercase tracking-[0.22em] text-primary">Bake & Brew account</p>
          <h1 className="mt-1 font-Bebas text-5xl tracking-wide text-text sm:text-6xl">My profile</h1>
        </div>

        <div className="grid items-start gap-7 lg:grid-cols-[350px_1fr]">
          <aside className="overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-sm">
            <div className="h-28 bg-gradient-to-r from-[#462a22] to-[#754638]" />
            <div className="-mt-14 px-8 pb-9 text-center">
              <div className="mx-auto grid h-28 w-28 place-items-center rounded-full border-4 border-white bg-primary font-Source text-4xl font-bold text-white shadow-md" aria-label={`${user.name} profile avatar`}>{initials}</div>
              <h2 className="mt-5 font-Source text-3xl font-bold text-text">{user.name}</h2>
              <p className="font-Source text-sm capitalize text-primary">{user.role || "user"} account</p>
              <div className="mt-7 space-y-4 border-t border-border pt-6 text-left">
                <div className="flex items-start gap-3"><FiMail className="mt-0.5 shrink-0 text-primary" /><div><p className="font-Source text-xs uppercase tracking-wide text-secondary">Email</p><p className="break-all font-Source text-sm text-text">{user.email}</p></div></div>
                <div className="flex items-start gap-3"><FiShield className="mt-0.5 shrink-0 text-primary" /><div><p className="font-Source text-xs uppercase tracking-wide text-secondary">Account access</p><p className="font-Source text-sm capitalize text-text">{user.role || "Customer"}</p></div></div>
              </div>
            </div>
          </aside>

          <section className="min-w-0 rounded-3xl border border-border bg-white p-4 shadow-sm sm:p-6">
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-fill p-1.5" role="tablist" aria-label="Profile history">
              {[{ id: "reservations", label: "Reservations", icon: <FiCalendar />, count: reservations.length }, { id: "orders", label: "Orders", icon: <FiPackage />, count: orders.length }].map((tab) => (
                <button key={tab.id} role="tab" aria-selected={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 font-Source text-sm font-semibold transition ${activeTab === tab.id ? "bg-white text-primary shadow-sm" : "text-secondary hover:text-text"}`}>
                  {tab.icon}<span>{tab.label}</span><span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-700">{tab.count}</span>
                </button>
              ))}
            </div>

            <div className="mt-6">
              {loading && <LoadingCards />}
              {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 font-Source text-red-700">{error}</div>}
              {!loading && !error && activeTab === "reservations" && <div className="space-y-3">
                {reservations.length === 0 && <EmptyState type="reservations" />}
                {reservations.map((reservation) => <article key={reservation._id} className="rounded-2xl border border-border p-5 transition hover:border-orange-200 hover:shadow-sm">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div><p className="font-Source text-lg font-bold text-text">{formatDate(reservation.startAt)}</p><p className="mt-1 font-Source text-sm text-secondary">{reservation.partySize} guests · Table {reservation.tableId?.tableNumber || "assigned"} · {reservation.tableId?.area || "indoor"}</p></div><span className="w-fit rounded-full bg-green-50 px-3 py-1 font-Source text-xs font-semibold uppercase tracking-wide text-green-700">{reservation.status}</span></div>
                </article>)}
              </div>}
              {!loading && !error && activeTab === "orders" && <div className="space-y-3">
                {orders.length === 0 && <EmptyState type="orders" />}
                {orders.map((order) => <article key={order._id} className="rounded-2xl border border-border p-5 transition hover:border-orange-200 hover:shadow-sm">
                  <div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="font-Source text-sm font-semibold text-text">{formatDate(order.createdAt)}</p><p className="mt-2 font-Source text-sm leading-relaxed text-secondary">{order.items.map((item) => `${item.quantity}× ${item.nameSnapshot}`).join(", ")}</p></div><p className="whitespace-nowrap font-Source text-lg font-bold text-primary">₹{Number(order.total).toFixed(2)}</p></div>
                  <div className="mt-4 flex justify-between border-t border-border pt-3 font-Source text-xs text-secondary"><span>Order #{order._id.slice(-6).toUpperCase()}</span><span>Delivery ₹{Number(order.deliveryFee || 0).toFixed(2)}</span></div>
                </article>)}
              </div>}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
