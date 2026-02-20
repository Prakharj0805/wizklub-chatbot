"use client";
import { useState, useEffect, useRef } from "react";

// ── Palette & helpers ──────────────────────────────────────────────────────────
const BRAND = {
  primary: "#FF6B35",
  secondary: "#1A1A2E",
  accent: "#00D4AA",
  purple: "#6C63FF",
  light: "#FFF9F5",
  card: "#ffffff",
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Lead store (simulated CRM) ─────────────────────────────────────────────────
const leads = [];

function scoreLead(lead) {
  let score = 0;
  if (lead.userType === "school") score += 30;
  if (lead.childrenCount > 1 || lead.studentCount > 100) score += 20;
  if (lead.urgency === "immediate") score += 25;
  if (lead.email) score += 15;
  if (lead.phone) score += 10;
  return Math.min(score, 100);
}

// ── Flow definitions ───────────────────────────────────────────────────────────
const PARENT_FLOW = [
  { id: "name", q: "What's your name? 😊", field: "name", type: "text", placeholder: "Your full name" },
  { id: "child_age", q: "How old is your child? (or enter multiple ages if you have more than one)", field: "childAge", type: "text", placeholder: "e.g. 8, 11" },
  { id: "interest", q: "What are you most interested in for your child?", field: "interest", type: "options", options: ["Coding & Robotics", "Math & Logic", "Science Experiments", "All STEM Areas"] },
  { id: "urgency", q: "When are you looking to start?", field: "urgency", type: "options", options: ["ASAP", "Next month", "Just exploring"] },
  { id: "phone", q: "Great! What's the best phone number to reach you?", field: "phone", type: "tel", placeholder: "10-digit mobile number" },
  { id: "email", q: "And your email address?", field: "email", type: "email", placeholder: "you@example.com" },
];

const SCHOOL_FLOW = [
  { id: "name", q: "Wonderful! May I know your name and your role at the school? 🏫", field: "name", type: "text", placeholder: "Name & Title (e.g. Priya Sharma, Principal)" },
  { id: "school_name", q: "What's the name of your school?", field: "schoolName", type: "text", placeholder: "School name" },
  { id: "student_count", q: "How many students does your school have?", field: "studentCount", type: "options", options: ["< 200", "200 – 500", "500 – 1000", "1000+"] },
  { id: "program_interest", q: "Which partnership program interests you?", field: "programInterest", type: "options", options: ["STEM Curriculum Integration", "After-School Clubs", "Teacher Training", "Full School Partnership"] },
  { id: "timeline", q: "What's your expected timeline?", field: "urgency", type: "options", options: ["This academic year", "Next academic year", "Exploring options"] },
  { id: "phone", q: "What's the best phone number to connect with you?", field: "phone", type: "tel", placeholder: "Your mobile number" },
  { id: "email", q: "And your official email?", field: "email", type: "email", placeholder: "you@school.com" },
];

// ── Message bubble ─────────────────────────────────────────────────────────────
function Bubble({ msg }) {
  const isBot = msg.sender === "bot";
  return (
    <div style={{ display: "flex", justifyContent: isBot ? "flex-start" : "flex-end", marginBottom: 12, animation: "fadeUp 0.3s ease" }}>
      {isBot && (
        <div style={{ width: 34, height: 34, borderRadius: "50%", background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.purple})`, display: "flex", alignItems: "center", justifyContent: "center", marginRight: 8, flexShrink: 0, fontSize: 16 }}>
          🤖
        </div>
      )}
      <div style={{
        maxWidth: "75%", padding: "10px 14px", borderRadius: isBot ? "4px 16px 16px 16px" : "16px 4px 16px 16px",
        background: isBot ? "#fff" : `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.purple})`,
        color: isBot ? BRAND.secondary : "#fff",
        boxShadow: isBot ? "0 2px 12px rgba(0,0,0,0.08)" : "0 2px 12px rgba(255,107,53,0.3)",
        fontSize: 14, lineHeight: 1.5, fontFamily: "'Nunito', sans-serif",
      }}>
        {msg.text}
      </div>
    </div>
  );
}

// ── Typing indicator ───────────────────────────────────────────────────────────
function Typing() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
      <div style={{ width: 34, height: 34, borderRadius: "50%", background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🤖</div>
      <div style={{ background: "#fff", borderRadius: "4px 16px 16px 16px", padding: "10px 16px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", display: "flex", gap: 4 }}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: BRAND.primary, display: "inline-block", animation: `bounce 1.2s ${i * 0.2}s infinite` }} />
        ))}
      </div>
    </div>
  );
}

// ── Score badge ────────────────────────────────────────────────────────────────
function ScoreBadge({ score }) {
  const color = score >= 70 ? "#00D4AA" : score >= 40 ? "#FF6B35" : "#aaa";
  const label = score >= 70 ? "Hot Lead 🔥" : score >= 40 ? "Warm Lead ☀️" : "Exploring 🌱";
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: color + "22", border: `1px solid ${color}`, borderRadius: 20, padding: "3px 10px", fontSize: 12, color, fontWeight: 700 }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, display: "inline-block" }} />
      {label} · Score: {score}
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────────
function Dashboard({ onBack }) {
  const parents = leads.filter(l => l.userType === "parent");
  const schools = leads.filter(l => l.userType === "school");
  const hot = leads.filter(l => scoreLead(l) >= 70);

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: 24, fontFamily: "'Nunito', sans-serif", background: BRAND.light }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button onClick={onBack} style={{ background: "none", border: `1px solid ${BRAND.primary}`, color: BRAND.primary, borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontFamily: "'Nunito', sans-serif", fontWeight: 700 }}>← Back</button>
        <h2 style={{ margin: 0, color: BRAND.secondary, fontSize: 20 }}>📊 Lead Dashboard</h2>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Total Leads", value: leads.length, icon: "👥", color: BRAND.purple },
          { label: "Hot Leads", value: hot.length, icon: "🔥", color: BRAND.primary },
          { label: "Schools", value: schools.length, icon: "🏫", color: BRAND.accent },
        ].map(card => (
          <div key={card.label} style={{ background: "#fff", borderRadius: 12, padding: "16px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", textAlign: "center" }}>
            <div style={{ fontSize: 24 }}>{card.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: card.color }}>{card.value}</div>
            <div style={{ fontSize: 12, color: "#888" }}>{card.label}</div>
          </div>
        ))}
      </div>

      {leads.length === 0 ? (
        <div style={{ textAlign: "center", color: "#aaa", padding: 40 }}>No leads yet. Chat first! 💬</div>
      ) : (
        leads.map((lead, i) => {
          const score = scoreLead(lead);
          return (
            <div key={i} style={{ background: "#fff", borderRadius: 12, padding: 16, marginBottom: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 800, color: BRAND.secondary, fontSize: 16 }}>{lead.name || "Unknown"}</div>
                  <div style={{ color: "#666", fontSize: 13 }}>{lead.email} · {lead.phone}</div>
                  <div style={{ color: "#888", fontSize: 12, marginTop: 4 }}>
                    {lead.userType === "school" ? `🏫 ${lead.schoolName || "School"} · ${lead.studentCount || ""} students` : `👨‍👩‍👧 Parent · Child age: ${lead.childAge || "?"}`}
                  </div>
                </div>
                <ScoreBadge score={score} />
              </div>
              <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[lead.interest || lead.programInterest, lead.urgency].filter(Boolean).map(tag => (
                  <span key={tag} style={{ background: BRAND.accent + "22", color: BRAND.accent, borderRadius: 12, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>{tag}</span>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

// ── Main Chatbot ───────────────────────────────────────────────────────────────
export default function WizKlubChatbot() {
  const [view, setView] = useState("chat"); // "chat" | "dashboard"
  const [messages, setMessages] = useState([]);
  const [stage, setStage] = useState("greeting"); // greeting | type_select | flow | done
  const [userType, setUserType] = useState(null);
  const [flowIndex, setFlowIndex] = useState(0);
  const [leadData, setLeadData] = useState({});
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [currentStep, setCurrentStep] = useState(null);
  const [isOpen, setIsOpen] = useState(true);
  const bottomRef = useRef(null);

  const flow = userType === "parent" ? PARENT_FLOW : userType === "school" ? SCHOOL_FLOW : [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  // Send bot message with typing delay
  const botSay = async (text, delay = 600) => {
    setTyping(true);
    await sleep(delay);
    setTyping(false);
    setMessages(prev => [...prev, { sender: "bot", text }]);
  };

  const userSay = (text) => {
    setMessages(prev => [...prev, { sender: "user", text }]);
  };

  // Init
  useEffect(() => {
    (async () => {
      await botSay("👋 Hi there! Welcome to **WizKlub** — where young minds discover their superpowers through STEM! 🚀", 400);
      await sleep(300);
      await botSay("I'm Wiz, your AI guide. I can help you explore our programs or set up a free demo.", 1000);
      await sleep(300);
      setStage("type_select");
    })();
  }, []);

  // Ask next flow question
  const askFlowQuestion = async (index, fl) => {
    const step = fl[index];
    if (!step) return;
    setCurrentStep(step);
    await botSay(step.q, 700);
  };

  const handleTypeSelect = async (type) => {
    setUserType(type);
    userSay(type === "parent" ? "👨‍👩‍👧 I'm a Parent" : "🏫 I represent a School");
    setStage("flow");

    const fl = type === "parent" ? PARENT_FLOW : SCHOOL_FLOW;
    if (type === "parent") {
      await botSay("Awesome!Let me personalize this for you 🎯", 800);
    } else {
      await botSay("Excellent!Let me get some details to tailor the best solution for you 🌟", 800);
    }
    setFlowIndex(0);
    await askFlowQuestion(0, fl);
  };

  const handleInput = async (value) => {
    if (!value.trim()) return;
    const step = currentStep;
    userSay(value);
    setInput("");

    // Save field
    const newData = { ...leadData, [step.field]: value, userType };
    setLeadData(newData);

    const nextIndex = flowIndex + 1;
    setFlowIndex(nextIndex);

    if (nextIndex < flow.length) {
      setCurrentStep(null);
      await askFlowQuestion(nextIndex, flow);
    } else {
      // Done
      setCurrentStep(null);
      setStage("done");
      const finalLead = { ...newData };
      leads.push(finalLead);
      const score = scoreLead(finalLead);

      await botSay("🎉 Perfect! I have all the details I need.", 800);

      if (score >= 70) {
        await botSay(`You're a priority lead (Score: ${score}/100)! Our team will reach out within 2 hours. 🔥`, 1000);
      } else {
        await botSay(`Thank you ${newData.name?.split(" ")[0] || ""}! Our team will reach out within 24 hours.`, 1000);
      }

      await botSay("📅 Want to skip the wait? Book a FREE demo directly:", 1200);
    }
  };

  const handleOptionClick = async (option) => {
    await handleInput(option);
  };

  if (view === "dashboard") {
    return (
      <div style={{ width: "100%", maxWidth: 480, height: 680, margin: "0 auto", borderRadius: 20, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", fontFamily: "'Nunito', sans-serif" }}>
        <Dashboard onBack={() => setView("chat")} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minHeight: "100vh", background: `linear-gradient(135deg, ${BRAND.secondary} 0%, #2d2b55 100%)`, justifyContent: "center", padding: 16, fontFamily: "'Nunito', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Space+Grotesk:wght@700;800&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes bounce { 0%,60%,100% { transform:translateY(0); } 30% { transform:translateY(-6px); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.6; } }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #ddd; border-radius: 4px; }
      `}</style>

      {/* Header branding */}
      <div style={{ marginBottom: 16, textAlign: "center" }}>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: -1 }}>
          Wiz<span style={{ color: BRAND.primary }}>Klub</span>
        </div>
        <div style={{ color: "#ffffff88", fontSize: 13 }}>Prakhar Jain Wizclub Chatbot</div>
      </div>

      {/* Chat window */}
      <div style={{ width: "100%", maxWidth: 440, height: 600, background: BRAND.light, borderRadius: 20, overflow: "hidden", boxShadow: "0 24px 80px rgba(0,0,0,0.4)", display: "flex", flexDirection: "column" }}>
        {/* Chat header */}
        <div style={{ background: `linear-gradient(135deg, ${BRAND.secondary}, #2d2b55)`, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: "50%", background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, boxShadow: `0 0 0 3px ${BRAND.primary}44` }}>🤖</div>
            <div>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 15 }}>Wiz Assistant</div>
              <div style={{ color: BRAND.accent, fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: BRAND.accent, display: "inline-block", animation: "pulse 2s infinite" }} />
                Online · Responds instantly
              </div>
            </div>
          </div>
          <button onClick={() => setView("dashboard")} style={{ background: BRAND.primary + "33", border: `1px solid ${BRAND.primary}55`, color: BRAND.primary, borderRadius: 8, padding: "5px 10px", fontSize: 12, cursor: "pointer", fontFamily: "'Nunito', sans-serif", fontWeight: 700 }}>📊 Dashboard</button>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 14px", background: "#f8f6ff" }}>
          {messages.map((m, i) => <Bubble key={i} msg={m} />)}
          {typing && <Typing />}

          {/* Type selector */}
          {stage === "type_select" && !typing && (
            <div style={{ display: "flex", gap: 10, marginTop: 8, animation: "fadeUp 0.4s ease" }}>
              {[
                { label: "👨‍👩‍👧 I'm a Parent", type: "parent", desc: "Explore programs for my child" },
                { label: "🏫 I'm from a School", type: "school", desc: "Explore partnership programs" },
              ].map(opt => (
                <button key={opt.type} onClick={() => handleTypeSelect(opt.type)} style={{ flex: 1, background: "#fff", border: `2px solid ${BRAND.primary}33`, borderRadius: 14, padding: "12px 10px", cursor: "pointer", fontFamily: "'Nunito', sans-serif", textAlign: "center", transition: "all 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.border = `2px solid ${BRAND.primary}`; e.currentTarget.style.background = BRAND.primary + "0a"; }}
                  onMouseLeave={e => { e.currentTarget.style.border = `2px solid ${BRAND.primary}33`; e.currentTarget.style.background = "#fff"; }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: BRAND.secondary }}>{opt.label}</div>
                  <div style={{ color: "#888", fontSize: 11, marginTop: 4 }}>{opt.desc}</div>
                </button>
              ))}
            </div>
          )}

          {/* Option buttons for flow */}
          {stage === "flow" && !typing && currentStep?.type === "options" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8, animation: "fadeUp 0.4s ease" }}>
              {currentStep.options.map(opt => (
                <button key={opt} onClick={() => handleOptionClick(opt)} style={{ background: "#fff", border: `1.5px solid ${BRAND.purple}33`, borderRadius: 10, padding: "10px 14px", textAlign: "left", cursor: "pointer", fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 700, color: BRAND.secondary, transition: "all 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.border = `1.5px solid ${BRAND.purple}`; e.currentTarget.style.background = BRAND.purple + "0a"; }}
                  onMouseLeave={e => { e.currentTarget.style.border = `1.5px solid ${BRAND.purple}33`; e.currentTarget.style.background = "#fff"; }}>
                  {opt}
                </button>
              ))}
            </div>
          )}

          {/* Done state CTA */}
          {stage === "done" && !typing && (
            <div style={{ background: "#fff", borderRadius: 16, padding: 16, marginTop: 8, boxShadow: "0 2px 16px rgba(0,0,0,0.08)", animation: "fadeUp 0.4s ease", textAlign: "center" }}>
              <div style={{ fontWeight: 800, color: BRAND.secondary, marginBottom: 8, fontSize: 15 }}>🎓 Book a FREE Demo</div>
              <a href="https://wizklub.com" target="_blank" rel="noreferrer" style={{ display: "block", background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.purple})`, color: "#fff", borderRadius: 10, padding: "12px", textDecoration: "none", fontWeight: 800, fontSize: 14, marginBottom: 8, boxShadow: "0 4px 16px rgba(255,107,53,0.35)" }}>
                📅 Schedule My Demo →
              </a>
              <div style={{ color: "#888", fontSize: 12 }}>or call us at <strong>1800-123-4567</strong></div>
              <div style={{ marginTop: 12, display: "flex", gap: 8, justifyContent: "center" }}>
                <ScoreBadge score={scoreLead({ ...leadData, userType })} />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        {stage === "flow" && currentStep && currentStep.type !== "options" && (
          <div style={{ padding: "12px 14px", background: "#fff", borderTop: "1px solid #f0eeff", display: "flex", gap: 8 }}>
            <input
              type={currentStep.type || "text"}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleInput(input)}
              placeholder={currentStep.placeholder || "Type your answer..."}
              style={{ flex: 1, border: `1.5px solid ${BRAND.purple}33`, borderRadius: 10, padding: "10px 12px", fontFamily: "'Nunito', sans-serif", fontSize: 14, outline: "none", color: BRAND.secondary }}
              onFocus={e => e.target.style.border = `1.5px solid ${BRAND.purple}`}
              onBlur={e => e.target.style.border = `1.5px solid ${BRAND.purple}33`}
              autoFocus
            />
            <button onClick={() => handleInput(input)} style={{ background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.purple})`, border: "none", borderRadius: 10, width: 42, height: 42, cursor: "pointer", fontSize: 18, flexShrink: 0 }}>
              ➤
            </button>
          </div>
        )}
      </div>

      {/* Footer note */}
      <div style={{ color: "#ffffff55", fontSize: 11, marginTop: 12, textAlign: "center" }}>
        WizKlub Chatbot· Powered by Prakhar Jain
      </div>
    </div>
  );
}