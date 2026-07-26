import { useContext, useMemo, useState } from "react";
import { FiCoffee, FiMessageCircle, FiSend, FiX } from "react-icons/fi";
import axiosInstance from "../utils/axiosInstance";
import { CartContext } from "../../context/CartContext";

const starters = [
  "What coffee do you recommend?",
  "Show me available cakes",
  "Help me reserve a table",
  "What's in my cart?",
];

export default function ChatWidget({ onLogin }) {
  const { fetchCart } = useContext(CartContext);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [workflowToken, setWorkflowToken] = useState(null);
  const [messages, setMessages] = useState([
    { id: "hello", role: "assistant", text: "Hi! I’m Bean. I can help with our menu, your cart, reservations and orders." },
  ]);
  const history = useMemo(() => messages.filter((item) => !item.pendingAction).slice(-6).map(({ role, text }) => ({ role, text })), [messages]);

  const addAssistant = (data) => setMessages((items) => [...items, {
    id: crypto.randomUUID(), role: "assistant", text: data.message,
    pendingAction: data.pendingAction, toolActivity: data.toolActivity,
    authRequired: data.authRequired, result: data.result,
  }]);

  async function send(preset) {
    const message = (preset ?? input).trim();
    if (!message || loading) return;
    setMessages((items) => [...items, { id: crypto.randomUUID(), role: "user", text: message }]);
    setInput("");
    setLoading(true);
    try {
      const { data } = await axiosInstance.post("/api/chat", { message, history, workflowToken });
      setWorkflowToken(data.workflowToken || null);
      addAssistant(data);
    } catch (error) {
      addAssistant({ message: error.response?.data?.message || "I couldn’t reach the cafe assistant. Please try again." });
    } finally { setLoading(false); }
  }

  async function confirm(messageId, token) {
    setLoading(true);
    try {
      const { data } = await axiosInstance.post("/api/chat/confirm", { token });
      setWorkflowToken(null);
      setMessages((items) => items.map((item) => item.id === messageId ? { ...item, pendingAction: null } : item));
      addAssistant(data);
      if (data.refreshCart) await fetchCart();
    } catch (error) {
      addAssistant({ message: error.response?.data?.message || "That confirmation could not be completed." });
    } finally { setLoading(false); }
  }

  function cancel(messageId) {
    setWorkflowToken(null);
    setMessages((items) => items.map((item) => item.id === messageId
      ? { ...item, pendingAction: null, text: "No problem — I cancelled that action." } : item));
  }

  return (
    <div className="fixed bottom-5 right-4 z-50 sm:bottom-7 sm:right-7">
      {open && (
        <section className="mb-3 flex h-[min(650px,calc(100vh-7rem))] w-[calc(100vw-2rem)] max-w-[390px] flex-col overflow-hidden rounded-3xl border border-orange-100 bg-[#fffaf6] shadow-2xl" aria-label="Cafe assistant">
          <header className="flex items-center justify-between bg-[#462a22] px-5 py-4 text-white">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-[#ee8542]"><FiCoffee size={20} /></span>
              <div><h2 className="font-semibold leading-tight">Ask Bean</h2><p className="text-xs text-orange-100">Bake N Brew assistant</p></div>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-full p-2 hover:bg-white/10" aria-label="Close chat"><FiX /></button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
            {messages.map((message) => (
              <div key={message.id} className={message.role === "user" ? "ml-auto max-w-[84%]" : "mr-auto max-w-[88%]"}>
                <div className={message.role === "user" ? "rounded-2xl rounded-br-md bg-[#ee8542] px-4 py-3 text-sm text-white" : "rounded-2xl rounded-bl-md border border-orange-100 bg-white px-4 py-3 text-sm text-stone-700 shadow-sm"}>
                  <p className="whitespace-pre-line">{message.text}</p>
                  {message.toolActivity?.length > 0 && <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-orange-600">Cafe tool · {message.toolActivity[0].status.replace("_", " ")}</p>}
                  {message.result?.startAt && <p className="mt-2 rounded-lg bg-orange-50 p-2 text-xs">Reservation: {new Date(message.result.startAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</p>}
                </div>
                {message.pendingAction && (
                  <div className="mt-2 rounded-2xl border border-orange-200 bg-orange-50 p-3 text-sm">
                    <p className="font-medium text-stone-800">{message.pendingAction.label}</p>
                    <div className="mt-3 flex gap-2">
                      <button disabled={loading} onClick={() => confirm(message.id, message.pendingAction.token)} className="rounded-full bg-[#ee8542] px-4 py-2 font-semibold text-white disabled:opacity-50">Confirm</button>
                      <button disabled={loading} onClick={() => cancel(message.id)} className="rounded-full border border-stone-300 bg-white px-4 py-2 text-stone-700">Cancel</button>
                    </div>
                  </div>
                )}
                {message.authRequired && <button onClick={onLogin} className="mt-2 text-xs font-semibold text-orange-700 underline">Log in to continue</button>}
              </div>
            ))}
            {loading && <div className="mr-auto rounded-2xl rounded-bl-md bg-white px-4 py-3 text-sm text-stone-500 shadow-sm">Bean is thinking…</div>}
            {messages.length === 1 && <div className="grid gap-2 pt-2">{starters.map((starter) => <button key={starter} onClick={() => send(starter)} className="rounded-xl border border-orange-200 bg-white px-3 py-2 text-left text-xs text-stone-700 hover:border-orange-400">{starter}</button>)}</div>}
          </div>

          <form onSubmit={(event) => { event.preventDefault(); send(); }} className="flex gap-2 border-t border-orange-100 bg-white p-3">
            <input value={input} onChange={(event) => setInput(event.target.value)} maxLength={600} placeholder="Ask about coffee, tables, orders…" className="min-w-0 flex-1 rounded-full border border-stone-300 px-4 py-2.5 text-sm outline-none focus:border-orange-500" aria-label="Message Bean" />
            <button disabled={loading || !input.trim()} className="grid h-10 w-10 place-items-center rounded-full bg-[#ee8542] text-white disabled:opacity-40" aria-label="Send message"><FiSend /></button>
          </form>
        </section>
      )}
      <button onClick={() => setOpen((value) => !value)} className="ml-auto grid h-14 w-14 place-items-center rounded-full bg-[#ee8542] text-white shadow-xl transition hover:scale-105 hover:bg-[#d97435]" aria-label={open ? "Close cafe assistant" : "Open cafe assistant"}>
        {open ? <FiX size={24} /> : <FiMessageCircle size={25} />}
      </button>
    </div>
  );
}
