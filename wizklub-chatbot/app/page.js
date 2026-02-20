"use client";
import { useState, useEffect, useRef, useCallback } from "react";

const C = {
  bg:      "#0B0D1A",
  panel:   "#111327",
  card:    "#161929",
  border:  "#ffffff0f",
  coral:   "#FF5F57",
  yellow:  "#FFD166",
  mint:    "#06D6A0",
  sky:     "#4CC9F0",
  purple:  "#7B2FBE",
  purpleL: "#9D4EDD",
  white:   "#F0F2FF",
  muted:   "#8B90B3",
};

const sleep = ms => new Promise(r => setTimeout(r, ms));


const leads = [];

function scoreLead(lead) {
  let s = 0;
  if (lead.userType === "school")                         s += 30;
  if ((lead.studentCount||"").includes("1000") || (lead.studentCount||"").includes("500")) s += 20;
  if ((lead.urgency||"").toLowerCase().includes("asap") || (lead.urgency||"").toLowerCase().includes("this academic")) s += 25;
  if (lead.email)  s += 15;
  if (lead.phone)  s += 10;
  return Math.min(s, 100);
}


const PARENT_FLOW = [
  { id:"name",    q:"First things first — what's your name? 😊",                        field:"name",         type:"text",    placeholder:"Your full name" },
  { id:"age",     q:"How old is your child? (Enter multiple ages if you have more!)",   field:"childAge",     type:"text",    placeholder:"e.g. 8, 11" },
  { id:"interest",q:"What superpower do you want to unlock for your child?",            field:"interest",     type:"options", options:["🤖 Coding & Robotics","🧮 Math & Logic","🔬 Science Experiments","🌟 All STEM Areas"] },
  { id:"urgency", q:"When are you thinking to start this journey?",                     field:"urgency",      type:"options", options:["⚡ ASAP — ready now!","📅 Next month","🔍 Just exploring"] },
  { id:"phone",   q:"Awesome! What's the best number to reach you?",                   field:"phone",        type:"tel",     placeholder:"Your mobile number" },
  { id:"email",   q:"And your email address? We'll send you a program guide 🎁",        field:"email",        type:"email",   placeholder:"you@example.com" },
];

const SCHOOL_FLOW = [
  { id:"name",    q:"Wonderful! What's your name and role at the school? 🏫",          field:"name",         type:"text",    placeholder:"Name & Role (e.g. Priya Sharma, Principal)" },
  { id:"school",  q:"Great! What's the name of your school?",                          field:"schoolName",   type:"text",    placeholder:"School name" },
  { id:"size",    q:"How many students does your school have?",                        field:"studentCount", type:"options", options:["👶 Under 200","👨‍👩‍👧 200 – 500","🏫 500 – 1,000","🌆 1,000+"] },
  { id:"program", q:"Which partnership excites you the most?",                         field:"programInterest",type:"options",options:["📚 STEM Curriculum Integration","🎯 After-School Clubs","👩‍🏫 Teacher Training","🚀 Full School Partnership"] },
  { id:"timeline",q:"What's your timeline?",                                           field:"urgency",      type:"options", options:["✅ This academic year","📆 Next academic year","🌱 Just exploring"] },
  { id:"phone",   q:"Best phone number to connect with you?",                          field:"phone",        type:"tel",     placeholder:"Your mobile number" },
  { id:"email",   q:"And your official email address?",                                field:"email",        type:"email",   placeholder:"you@school.com" },
];


function StarField() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let W = canvas.width  = canvas.offsetWidth;
    let H = canvas.height = canvas.offsetHeight;

    const stars = Array.from({ length: 60 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.5 + 0.3,
      speed: Math.random() * 0.3 + 0.05,
      opacity: Math.random() * 0.6 + 0.1,
      twinkle: Math.random() * Math.PI * 2,
    }));

    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      stars.forEach(s => {
        s.twinkle += 0.02;
        s.y -= s.speed;
        if (s.y < 0) { s.y = H; s.x = Math.random() * W; }
        const alpha = s.opacity * (0.7 + 0.3 * Math.sin(s.twinkle));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200,210,255,${alpha})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    const onResize = () => { W = canvas.width = canvas.offsetWidth; H = canvas.height = canvas.offsetHeight; };
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents:"none" }} />;
}


function XPBar({ current, total }) {
  const pct = total ? Math.round((current / total) * 100) : 0;
  return (
    <div style={{ padding:"8px 16px", background: C.panel, borderBottom:`1px solid ${C.border}` }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
        <span style={{ fontSize:10, color:C.muted, fontFamily:"'DM Sans',sans-serif", letterSpacing:"0.08em", textTransform:"uppercase" }}>
          Quest Progress
        </span>
        <span style={{ fontSize:10, color:C.yellow, fontWeight:700, fontFamily:"'DM Sans',sans-serif" }}>
          {pct}% Complete
        </span>
      </div>
      <div style={{ height:5, borderRadius:99, background:"#ffffff10", overflow:"hidden" }}>
        <div style={{
          height:"100%", borderRadius:99,
          background:`linear-gradient(90deg, ${C.coral}, ${C.yellow})`,
          width:`${pct}%`,
          transition:"width 0.6s cubic-bezier(.34,1.56,.64,1)",
          boxShadow:`0 0 8px ${C.coral}88`,
        }} />
      </div>
    </div>
  );
}


function Bubble({ msg, idx }) {
  const isBot = msg.sender === "bot";
  return (
    <div style={{
      display:"flex", justifyContent: isBot ? "flex-start" : "flex-end",
      marginBottom:10, animation:`slideIn 0.35s cubic-bezier(.34,1.2,.64,1) both`,
      animationDelay:`${idx * 0.04}s`,
    }}>
      {isBot && (
        <div style={{
          width:32, height:32, borderRadius:"50%", flexShrink:0, marginRight:8,
          background:`linear-gradient(135deg, ${C.coral}, ${C.purpleL})`,
          display:"flex", alignItems:"center", justifyContent:"center", fontSize:15,
          boxShadow:`0 0 12px ${C.coral}55`,
        }}>✨</div>
      )}
      <div style={{
        maxWidth:"76%",
        padding:"10px 14px",
        borderRadius: isBot ? "4px 16px 16px 16px" : "16px 4px 16px 16px",
        background: isBot
          ? `linear-gradient(135deg, ${C.card}, #1e2035)`
          : `linear-gradient(135deg, ${C.coral}, ${C.purple})`,
        color: C.white,
        fontSize:13.5, lineHeight:1.6,
        fontFamily:"'DM Sans',sans-serif",
        border: isBot ? `1px solid ${C.border}` : "none",
        boxShadow: isBot
          ? `0 4px 20px #00000044`
          : `0 4px 20px ${C.coral}44`,
      }}>
        {msg.text}
      </div>
    </div>
  );
}


function Typing() {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
      <div style={{ width:32, height:32, borderRadius:"50%", background:`linear-gradient(135deg,${C.coral},${C.purpleL})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, boxShadow:`0 0 12px ${C.coral}55` }}>✨</div>
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:"4px 16px 16px 16px", padding:"12px 16px", display:"flex", gap:5 }}>
        {[0,1,2].map(i=>(
          <span key={i} style={{ width:6,height:6,borderRadius:"50%",background:C.coral,display:"inline-block",animation:`dotBounce 1.1s ${i*0.18}s infinite ease-in-out` }} />
        ))}
      </div>
    </div>
  );
}


function ScoreBadge({ score }) {
  const [color, label, emoji] =
    score >= 70 ? [C.mint,   "Hot Lead",      "🔥"] :
    score >= 40 ? [C.yellow, "Warm Lead",     "☀️"] :
                  [C.muted,  "Early Explorer","🌱"];
  return (
    <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:color+"18", border:`1px solid ${color}55`, borderRadius:20, padding:"4px 12px", fontSize:11.5, color, fontWeight:700, fontFamily:"'DM Sans',sans-serif" }}>
      {emoji} {label} · Score: <strong>{score}</strong>/100
    </div>
  );
}


function OptionBtn({ label, onClick, delay = 0 }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? `linear-gradient(135deg,${C.coral}22,${C.purpleL}22)` : C.card,
        border: `1.5px solid ${hov ? C.coral : C.border}`,
        borderRadius:12, padding:"11px 16px", textAlign:"left",
        cursor:"pointer", fontFamily:"'DM Sans',sans-serif",
        fontSize:13.5, fontWeight:600, color: hov ? C.white : C.white,
        transition:"all 0.2s", display:"block", width:"100%",
        animation:`slideIn 0.35s cubic-bezier(.34,1.2,.64,1) ${delay}s both`,
        boxShadow: hov ? `0 0 16px ${C.coral}33` : "none",
        transform: hov ? "translateX(4px)" : "none",
      }}>
      {label}
    </button>
  );
}


function Dashboard({ onBack }) {
  const hot = leads.filter(l => scoreLead(l) >= 70).length;
  const schools = leads.filter(l => l.userType === "school").length;
  const avgScore = leads.length ? Math.round(leads.reduce((a,l)=>a+scoreLead(l),0)/leads.length) : 0;

  const stat = (icon, val, lbl, col) => (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"18px 14px", textAlign:"center" }}>
      <div style={{ fontSize:26, marginBottom:6 }}>{icon}</div>
      <div style={{ fontSize:30, fontWeight:800, color:col, fontFamily:"'Fredoka One',sans-serif", lineHeight:1 }}>{val}</div>
      <div style={{ fontSize:11, color:C.muted, marginTop:4, fontFamily:"'DM Sans',sans-serif" }}>{lbl}</div>
    </div>
  );

  return (
    <div style={{ height:"100%", overflowY:"auto", padding:20, background:C.bg, fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
        <button onClick={onBack} style={{ background:"none", border:`1px solid ${C.coral}`, color:C.coral, borderRadius:8, padding:"6px 14px", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontWeight:700 }}>← Back</button>
        <h2 style={{ margin:0, color:C.white, fontFamily:"'Fredoka One',sans-serif", fontSize:20, letterSpacing:"0.02em" }}>📊 Mission Control</h2>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:18 }}>
        {stat("👥", leads.length, "Total Leads", C.sky)}
        {stat("🔥", hot, "Hot Leads", C.coral)}
        {stat("🏫", schools, "Schools", C.mint)}
        {stat("⭐", avgScore, "Avg Score", C.yellow)}
      </div>

      {leads.length === 0 ? (
        <div style={{ textAlign:"center", color:C.muted, padding:40, fontSize:14 }}>No leads yet — go chat! 🚀</div>
      ) : leads.map((lead, i) => {
        const score = scoreLead(lead);
        const [scoreColor] = score >= 70 ? [C.mint] : score >= 40 ? [C.yellow] : [C.muted];
        return (
          <div key={i} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:16, marginBottom:10 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:8 }}>
              <div>
                <div style={{ fontWeight:700, color:C.white, fontSize:15 }}>{lead.name||"Unknown"}</div>
                <div style={{ color:C.muted, fontSize:12.5, marginTop:2 }}>{lead.email} · {lead.phone}</div>
                <div style={{ color:C.muted, fontSize:11.5, marginTop:4 }}>
                  {lead.userType==="school" ? `🏫 ${lead.schoolName||"School"} · ${lead.studentCount||"?"} students` : `👨‍👩‍👧 Parent · Ages: ${lead.childAge||"?"}`}
                </div>
              </div>
              <ScoreBadge score={score} />
            </div>
            <div style={{ marginTop:10, display:"flex", gap:6, flexWrap:"wrap" }}>
              {[lead.interest||lead.programInterest, lead.urgency].filter(Boolean).map(tag=>(
                <span key={tag} style={{ background:`${C.sky}18`, color:C.sky, border:`1px solid ${C.sky}44`, borderRadius:99, padding:"2px 10px", fontSize:11, fontWeight:600 }}>{tag}</span>
              ))}
            </div>
            {/* mini score bar */}
            <div style={{ marginTop:10, height:3, borderRadius:99, background:"#ffffff08" }}>
              <div style={{ height:"100%", borderRadius:99, width:`${score}%`, background:`linear-gradient(90deg,${scoreColor},${scoreColor}88)`, transition:"width 1s ease" }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}


export default function App() {
  const [view,        setView]       = useState("chat");
  const [messages,    setMessages]   = useState([]);
  const [stage,       setStage]      = useState("greeting");
  const [userType,    setUserType]   = useState(null);
  const [flowIndex,   setFlowIndex]  = useState(0);
  const [leadData,    setLeadData]   = useState({});
  const [input,       setInput]      = useState("");
  const [typing,      setTyping]     = useState(false);
  const [currentStep, setCurrentStep]= useState(null);
  const [xp,          setXp]         = useState(0);
  const [totalXp,     setTotalXp]    = useState(1);
  const [showParticle,setShowParticle]= useState(null); // {x,y}
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages, typing]);

  const botSay = useCallback(async (text, delay = 700) => {
    setTyping(true);
    await sleep(delay);
    setTyping(false);
    setMessages(prev => [...prev, { sender:"bot", text }]);
  }, []);

  const userSay = (text) => setMessages(prev => [...prev, { sender:"user", text }]);

  // Init greeting
  useEffect(() => {
    (async () => {
      await botSay("👋 Hey there! Welcome to WizKlub — where young minds discover their superpowers through STEM! 🚀", 500);
      await sleep(200);
      await botSay("I'm Wiz, your personal guide. Tell me a bit about yourself so I can find the perfect program for you.", 1100);
      await sleep(200);
      setStage("type_select");
    })();
  }, []);

  const askStep = async (index, fl) => {
    const step = fl[index];
    if (!step) return;
    setCurrentStep(step);
    setXp(index);
    await botSay(step.q, 600);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleTypeSelect = async (type) => {
    setUserType(type);
    userSay(type === "parent" ? "👨‍👩‍👧 I'm a Parent" : "🏫 I represent a School");
    setStage("flow");
    const fl = type === "parent" ? PARENT_FLOW : SCHOOL_FLOW;
    setTotalXp(fl.length);
    const msg = type === "parent"
      ? "Wonderful! WizKlub has helped 50,000+ kids unlock their genius. Let's personalise this for your child 🎯"
      : "Excellent! We partner with 500+ schools across India. Let me find the best fit for your institution 🏆";
    await botSay(msg, 800);
    setFlowIndex(0);
    await askStep(0, fl);
  };

  const handleInput = async (value) => {
    if (!value.trim()) return;
    const step = currentStep;
    userSay(value);
    setInput("");

    const newData = { ...leadData, [step.field]: value, userType };
    setLeadData(newData);
    const next = flowIndex + 1;
    setFlowIndex(next);

    const fl = userType === "parent" ? PARENT_FLOW : SCHOOL_FLOW;
    if (next < fl.length) {
      setCurrentStep(null);
      setXp(next);
      await askStep(next, fl);
    } else {
      setCurrentStep(null);
      setStage("done");
      setXp(fl.length);
      const finalLead = { ...newData };
      leads.push(finalLead);
      const score = scoreLead(finalLead);
      await botSay("🎉 You're all set! I've got everything I need.", 800);
      if (score >= 70) {
        await botSay(`🔥 You're a priority — our team will reach you within 2 hours! (Lead score: ${score}/100)`, 1000);
      } else {
        await botSay(`Thanks ${newData.name?.split(" ")[0]||""}! Our team will be in touch within 24 hours.`, 1000);
      }
      await botSay("📅 Want to lock in your spot right now? Book a FREE demo below:", 1200);
    }
  };

  if (view === "dashboard") return (
    <div style={{ width:"100%", maxWidth:480, height:680, margin:"0 auto", background:C.bg, borderRadius:24, overflow:"hidden", boxShadow:`0 30px 80px #00000088` }}>
      <Dashboard onBack={() => setView("chat")} />
    </div>
  );

  const fl = userType === "parent" ? PARENT_FLOW : userType === "school" ? SCHOOL_FLOW : [];

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", minHeight:"100vh", justifyContent:"center", padding:16, position:"relative", overflow:"hidden", background:`radial-gradient(ellipse at 20% 20%, #1a0533 0%, ${C.bg} 60%)` }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes slideIn { from { opacity:0; transform:translateY(10px) scale(0.97); } to { opacity:1; transform:none; } }
        @keyframes dotBounce { 0%,80%,100%{transform:scale(0.7);opacity:0.4} 40%{transform:scale(1);opacity:1} }
        @keyframes floatBadge { 0%{transform:translateY(0);} 50%{transform:translateY(-6px);} 100%{transform:translateY(0);} }
        @keyframes glowPulse { 0%,100%{box-shadow:0 0 20px ${C.coral}44;} 50%{box-shadow:0 0 40px ${C.coral}88,0 0 60px ${C.purpleL}44;} }
        @keyframes shimmer { 0%{background-position:-200% center;} 100%{background-position:200% center;} }
        @keyframes confetti { 0%{transform:translateY(0) rotate(0deg);opacity:1;} 100%{transform:translateY(-80px) rotate(720deg);opacity:0;} }
        ::-webkit-scrollbar{width:3px;} ::-webkit-scrollbar-thumb{background:${C.border};border-radius:4px;}
        * { box-sizing:border-box; }
      `}</style>

      {/* Cosmic background */}
      <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0 }}>
        <StarField />
        {/* Glow orbs */}
        <div style={{ position:"absolute", top:"10%", left:"5%",  width:300, height:300, borderRadius:"50%", background:`radial-gradient(circle, ${C.purple}33 0%, transparent 70%)`, filter:"blur(40px)" }} />
        <div style={{ position:"absolute", bottom:"10%", right:"5%", width:250, height:250, borderRadius:"50%", background:`radial-gradient(circle, ${C.coral}22 0%, transparent 70%)`,  filter:"blur(40px)" }} />
      </div>

      {/* Branding above */}
      <div style={{ zIndex:1, marginBottom:14, textAlign:"center", animation:"slideIn 0.5s ease both" }}>
        <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:32, color:C.white, letterSpacing:"0.02em", lineHeight:1 }}>
          Wiz<span style={{ color:C.coral }}>Klub</span>
        </div>
        <div style={{ color:C.muted, fontSize:12, marginTop:2, fontFamily:"'DM Sans',sans-serif" }}>STEM · Chatbot Demo by Prakhar Jain</div>
      </div>

      {/* Chat window */}
      <div style={{
        position:"relative", zIndex:1, width:"100%", maxWidth:440, height:620,
        background:C.panel, borderRadius:24, overflow:"hidden",
        border:`1px solid ${C.border}`,
        boxShadow:`0 30px 80px #00000088, 0 0 0 1px ${C.coral}22`,
        display:"flex", flexDirection:"column",
        animation:"glowPulse 4s ease-in-out infinite",
      }}>

        {/* Header */}
        <div style={{ background:C.bg, padding:"14px 16px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:40, height:40, borderRadius:"50%", background:`linear-gradient(135deg,${C.coral},${C.purpleL})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, boxShadow:`0 0 16px ${C.coral}55`, animation:"floatBadge 3s ease-in-out infinite" }}>
              ✨
            </div>
            <div>
              <div style={{ color:C.white, fontWeight:700, fontSize:15, fontFamily:"'Fredoka One',cursive", letterSpacing:"0.02em" }}>Wiz Assistant</div>
              <div style={{ color:C.mint, fontSize:11, display:"flex", alignItems:"center", gap:4, fontFamily:"'DM Sans',sans-serif" }}>
                <span style={{ width:6,height:6,borderRadius:"50%",background:C.mint,display:"inline-block",animation:"dotBounce 1.5s 0s infinite" }} />
                Online · AI-Powered
              </div>
            </div>
          </div>
          <button onClick={() => setView("dashboard")} style={{
            background:`linear-gradient(135deg,${C.coral}22,${C.purpleL}22)`,
            border:`1px solid ${C.coral}44`, color:C.coral, borderRadius:10,
            padding:"6px 12px", fontSize:12, cursor:"pointer",
            fontFamily:"'DM Sans',sans-serif", fontWeight:700, transition:"all 0.2s",
          }}
            onMouseEnter={e=>{e.currentTarget.style.background=`linear-gradient(135deg,${C.coral}44,${C.purpleL}44)`;}}
            onMouseLeave={e=>{e.currentTarget.style.background=`linear-gradient(135deg,${C.coral}22,${C.purpleL}22)`;}}
          >📊 Dashboard</button>
        </div>

        {/* XP progress bar */}
        {stage === "flow" && <XPBar current={xp} total={totalXp} />}

        {/* Messages */}
        <div style={{ flex:1, overflowY:"auto", padding:"16px 14px", display:"flex", flexDirection:"column" }}>
          {messages.map((m,i) => <Bubble key={i} msg={m} idx={i} />)}
          {typing && <Typing />}

          {/* Type selector */}
          {stage === "type_select" && !typing && (
            <div style={{ display:"flex", gap:10, marginTop:8 }}>
              {[
                { label:"👨‍👩‍👧 I'm a Parent",  type:"parent", sub:"Explore programs for my child",   icon:"🎒" },
                { label:"🏫 School Rep",       type:"school", sub:"Explore partnership programs",     icon:"🤝" },
              ].map((opt, oi) => {
                const [hov, setHov] = [false, (v) => {}]; // static, individual state not needed for two btns
                return (
                  <TypeCard key={opt.type} opt={opt} delay={oi * 0.1} onSelect={() => handleTypeSelect(opt.type)} />
                );
              })}
            </div>
          )}

          {/* Option buttons */}
          {stage === "flow" && !typing && currentStep?.type === "options" && (
            <div style={{ display:"flex", flexDirection:"column", gap:7, marginTop:8 }}>
              {currentStep.options.map((opt, i) => (
                <OptionBtn key={opt} label={opt} delay={i * 0.07} onClick={() => handleInput(opt)} />
              ))}
            </div>
          )}

          {/* Done CTA */}
          {stage === "done" && !typing && (
            <DoneCTA leadData={leadData} userType={userType} />
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        {stage === "flow" && currentStep && currentStep.type !== "options" && (
          <div style={{ padding:"10px 12px", background:C.bg, borderTop:`1px solid ${C.border}`, display:"flex", gap:8, flexShrink:0 }}>
            <input
              ref={inputRef}
              type={currentStep.type || "text"}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleInput(input)}
              placeholder={currentStep.placeholder || "Type here…"}
              style={{
                flex:1, background:C.card, border:`1.5px solid ${C.border}`,
                borderRadius:12, padding:"10px 14px",
                fontFamily:"'DM Sans',sans-serif", fontSize:14, color:C.white,
                outline:"none", transition:"border-color 0.2s",
              }}
              onFocus={e  => e.target.style.borderColor = C.coral}
              onBlur={e   => e.target.style.borderColor = C.border}
            />
            <button
              onClick={() => handleInput(input)}
              style={{
                background:`linear-gradient(135deg,${C.coral},${C.purple})`,
                border:"none", borderRadius:12, width:44, height:44,
                cursor:"pointer", fontSize:18, flexShrink:0,
                boxShadow:`0 4px 16px ${C.coral}44`,
                transition:"transform 0.15s, box-shadow 0.15s",
              }}
              onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.1)";}}
              onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";}}
            >🚀</button>
          </div>
        )}
      </div>

      <div style={{ zIndex:1, marginTop:14, color:`${C.muted}99`, fontSize:11, fontFamily:"'DM Sans',sans-serif" }}>
        WizKlub Chatbot · Built by Prakhar Jain
      </div>
    </div>
  );
}

// ── Type selector card ─────────────────────────────────────────
function TypeCard({ opt, delay, onSelect }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onSelect}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        flex:1, background: hov ? `linear-gradient(135deg,${C.coral}18,${C.purpleL}18)` : C.card,
        border:`1.5px solid ${hov ? C.coral : C.border}`,
        borderRadius:16, padding:"16px 12px", cursor:"pointer",
        fontFamily:"'DM Sans',sans-serif", textAlign:"center",
        transition:"all 0.25s cubic-bezier(.34,1.56,.64,1)",
        transform: hov ? "translateY(-4px) scale(1.03)" : "none",
        boxShadow: hov ? `0 12px 32px ${C.coral}33` : "0 4px 16px #00000044",
        animation:`slideIn 0.4s cubic-bezier(.34,1.2,.64,1) ${delay}s both`,
      }}>
      <div style={{ fontSize:28, marginBottom:8 }}>{opt.icon}</div>
      <div style={{ fontWeight:700, fontSize:13.5, color:C.white, marginBottom:4 }}>{opt.label}</div>
      <div style={{ color:C.muted, fontSize:11 }}>{opt.sub}</div>
    </button>
  );
}

// ── Done / CTA card ────────────────────────────────────────────
function DoneCTA({ leadData, userType }) {
  const score = scoreLead({ ...leadData, userType });
  const [hov, setHov] = useState(false);
  return (
    <div style={{
      background:C.card, border:`1px solid ${C.coral}44`,
      borderRadius:20, padding:20, marginTop:10,
      boxShadow:`0 8px 32px ${C.coral}22`,
      animation:"slideIn 0.5s cubic-bezier(.34,1.2,.64,1) both",
      textAlign:"center",
    }}>
      {/* Shimmer headline */}
      <div style={{
        fontFamily:"'Fredoka One',cursive", fontSize:22, marginBottom:4,
        background:`linear-gradient(90deg,${C.coral},${C.yellow},${C.coral})`,
        backgroundSize:"200% auto",
        WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
        animation:"shimmer 2.5s linear infinite",
      }}>🎓 Book a FREE Demo</div>
      <div style={{ color:C.muted, fontSize:12.5, marginBottom:14, fontFamily:"'DM Sans',sans-serif" }}>
        Join 50,000+ students already on the WizKlub journey!
      </div>
      <a
        href="https://wizklub.com"
        target="_blank" rel="noreferrer"
        onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.04)";}}
        onMouseLeave={e=>{e.currentTarget.style.transform="none";}}
        style={{
          display:"block",
          background:`linear-gradient(135deg,${C.coral},${C.purple})`,
          color:"#fff", borderRadius:14, padding:"13px",
          textDecoration:"none", fontWeight:700, fontSize:14,
          fontFamily:"'DM Sans',sans-serif",
          marginBottom:12,
          boxShadow:`0 6px 24px ${C.coral}55`,
          transition:"transform 0.2s",
        }}>
        📅 Schedule My Demo →
      </a>
      <div style={{ color:C.muted, fontSize:12, fontFamily:"'DM Sans',sans-serif", marginBottom:14 }}>
        or call <strong style={{ color:C.white }}>1800-123-4567</strong> ·
      </div>
      <ScoreBadge score={score} />
    </div>
  );
}
