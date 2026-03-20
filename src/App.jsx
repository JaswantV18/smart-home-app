import { useState, useRef, useEffect } from "react";

// ─── Design Tokens ─────────────────────────────────────────────────────────
const C = {
  saffron:    "#E8620A",
  turmeric:   "#F0A500",
  kumkum:     "#C0392B",
  marigold:   "#F4C430",
  jasmine:    "#FFF9EE",
  peacock:    "#1A6B5A",
  indigo:     "#2C3E7A",
  sandal:     "#F5E6D0",
  clay:       "#A0522D",
  dark:       "#1C1208",
  muted:      "#8B7355",
  card:       "#FFFDF7",
  border:     "#EAD9BB",
};

const TABS = [
  { id: "home",     icon: "🏠", label: "Home"     },
  { id: "meals",    icon: "🍛", label: "Meals"    },
  { id: "festival", icon: "🪔", label: "Festivals" },
  { id: "budget",   icon: "💰", label: "Budget"   },
  { id: "kids",     icon: "📚", label: "Kids"     },
  { id: "settings", icon: "⚙️", label: "Settings"  },
];

// ─── Mock Data ──────────────────────────────────────────────────────────────
const TODAY_TASKS = [
  { id:1, text:"Prepare tiffin for kids",      time:"7:00 AM", done:false, cat:"kitchen"  },
  { id:2, text:"Sweep & mop the house",         time:"9:00 AM", done:true,  cat:"cleaning" },
  { id:3, text:"Soak rajma for dinner",          time:"10:00 AM",done:false, cat:"kitchen"  },
  { id:4, text:"Collect school report card",    time:"12:00 PM",done:false, cat:"kids"     },
  { id:5, text:"Pay electricity bill online",   time:"3:00 PM", done:false, cat:"finance"  },
  { id:6, text:"Evening pooja",                  time:"6:30 PM", done:false, cat:"pooja"    },
];

const WEEK_MEALS = {
  Mon: { b:"Poha + Chai",         l:"Dal Tadka + Roti",       d:"Rajma Chawal"          },
  Tue: { b:"Idli + Sambar",       l:"Aloo Sabzi + Paratha",   d:"Palak Paneer + Rice"   },
  Wed: { b:"Upma + Coffee",       l:"Chole + Bhature",        d:"Khichdi + Papad"       },
  Thu: { b:"Dosa + Chutney",      l:"Mixed Veg + Roti",       d:"Chicken Curry + Rice"  },
  Fri: { b:"Paratha + Curd",      l:"Sambar Rice",            d:"Paneer Butter Masala"  },
  Sat: { b:"Puri + Aloo",         l:"Biryani",                d:"Light Khichdi"         },
  Sun: { b:"Halwa + Puri",        l:"Full Family Meal 🎉",    d:"Leftovers / Order"     },
};





// ─── API Key ────────────────────────────────────────────────────────────────
let _apiKey      = "";
let _apiProvider = "groq"; // "groq" | "claude"

// ─── Helpers ────────────────────────────────────────────────────────────────
async function askClaude(system, userMsg, history = []) {
  const key = _apiKey;
  if (!key) return "⚠️ No API key set. Please go to ⚙️ Settings and enter your Groq API key — it's free!";

  try {
    // Try Vercel serverless proxy first (production), fall back to direct call (dev/StackBlitz)
    const useProxy = window.location.hostname !== "localhost" &&
                     !window.location.hostname.includes("stackblitz") &&
                     !window.location.hostname.includes("webcontainer");

    if (useProxy) {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: _apiProvider,
          apiKey: key,
          system,
          messages: [...history, { role:"user", content: userMsg }],
        }),
      });
      const data = await res.json();
      if (data.error) return `❌ Error: ${data.error}`;
      return data.text || "Sorry, something went wrong.";
    }

    // Direct call for local/StackBlitz dev
    if (_apiProvider === "groq") {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: system },
            ...history,
            { role: "user", content: userMsg },
          ],
          max_tokens: 1000,
        }),
      });
      const data = await res.json();
      if (data.error) return `❌ Error: ${data.error.message}`;
      return data.choices?.[0]?.message?.content || "Sorry, something went wrong.";

    } else {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system,
          messages: [...history, { role:"user", content: userMsg }],
        }),
      });
      const data = await res.json();
      if (data.error) return `❌ Error: ${data.error.message}`;
      return data.content?.[0]?.text || "Sorry, something went wrong.";
    }
  } catch { return "Connection error. Please try again."; }
}

function AiChat({ system, placeholder, accent = C.saffron }) {
  const [chat, setChat]       = useState([]);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const ref = useRef(null);

  const send = async (msg) => {
    const m = msg || input;
    if (!m.trim() || loading) return;
    setInput("");
    setChat(c => [...c, { role:"user", text:m }]);
    setLoading(true);
    const reply = await askClaude(system, m, history);
    setHistory(h => [...h, { role:"user", content:m }, { role:"assistant", content:reply }]);
    setChat(c => [...c, { role:"assistant", text:reply }]);
    setLoading(false);
    setTimeout(() => ref.current?.scrollTo(0, ref.current.scrollHeight), 100);
  };

  return (
    <div style={{ background: C.card, borderRadius:16, border:`1.5px solid ${C.border}`, overflow:"hidden" }}>
      <div style={{ background: accent + "18", padding:"10px 14px", fontSize:12, fontWeight:700, color: accent, letterSpacing:"0.05em" }}>
        ✨ AI ASSISTANT
      </div>
      <div ref={ref} style={{ minHeight:70, maxHeight:180, overflowY:"auto", padding:"10px 14px" }}>
        {chat.length === 0 && <p style={{ fontSize:13, color:C.muted, fontStyle:"italic", margin:0 }}>{placeholder}</p>}
        {chat.map((m,i) => (
          <div key={i} style={{ display:"flex", justifyContent: m.role==="user"?"flex-end":"flex-start", marginBottom:8 }}>
            <div style={{
              maxWidth:"82%", padding:"8px 12px", borderRadius:12, fontSize:13, lineHeight:1.5,
              background: m.role==="user" ? accent : C.sandal,
              color: m.role==="user" ? "#fff" : C.dark,
            }}>{m.text}</div>
          </div>
        ))}
        {loading && <p style={{ fontSize:12, color:C.muted, fontStyle:"italic", margin:0 }}>Thinking…</p>}
      </div>
      <div style={{ display:"flex", gap:8, padding:"10px 14px", borderTop:`1px solid ${C.border}` }}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()}
          placeholder="Type here…"
          style={{ flex:1, border:`1.5px solid ${C.border}`, borderRadius:10, padding:"8px 12px", fontSize:13, outline:"none", background:C.jasmine, fontFamily:"inherit" }} />
        <button onClick={()=>send()} disabled={loading}
          style={{ background: accent, color:"#fff", border:"none", borderRadius:10, padding:"8px 14px", cursor:"pointer", fontSize:16 }}>→</button>
      </div>
    </div>
  );
}

// ─── Decorative rangoli dots ────────────────────────────────────────────────
function RangoliDot({ color = C.saffron, size = 6 }) {
  return <span style={{ display:"inline-block", width:size, height:size, borderRadius:"50%", background:color, flexShrink:0 }} />;
}

// ═══════════════════════════════════════════════════════════════════════════
// SCREENS
// ═══════════════════════════════════════════════════════════════════════════

// ── Home ──────────────────────────────────────────────────────────────────
function HomeScreen({ tasks, setTasks, profileName, totalSpent, salary }) {
  const [newTask, setNewTask] = useState("");
  const done = tasks.filter(t=>t.done).length;
  const today = new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long"});

  const catColor = { kitchen:C.saffron, cleaning:C.peacock, kids:C.indigo, finance:C.turmeric, pooja:C.kumkum, general:C.muted };
  const catIcon  = { kitchen:"🍳", cleaning:"🧹", kids:"👧", finance:"💰", pooja:"🪔", general:"📌" };

  return (
    <div style={{ padding:"20px 18px 100px" }}>
      {/* Greeting banner */}
      <div style={{
        background:`linear-gradient(135deg, ${C.saffron}, ${C.turmeric})`,
        borderRadius:20, padding:"18px 20px", marginBottom:20,
        position:"relative", overflow:"hidden",
      }}>
        <div style={{ position:"absolute", right:-10, top:-10, fontSize:70, opacity:0.15 }}>🏡</div>
        <div style={{ fontSize:12, color:"rgba(255,255,255,0.85)", marginBottom:4 }}>{today}</div>
        <div style={{ fontFamily:"'Georgia',serif", fontSize:22, color:"#fff", fontStyle:"italic" }}>
          Namaste, {profileName} 🙏
        </div>
        <div style={{ fontSize:13, color:"rgba(255,255,255,0.9)", marginTop:6 }}>
          {done}/{tasks.length} tasks done today · You're doing great!
        </div>
        {/* Progress bar */}
        <div style={{ background:"rgba(255,255,255,0.3)", borderRadius:10, height:6, marginTop:12 }}>
          <div style={{ background:"#fff", borderRadius:10, height:6, width:`${(done/tasks.length)*100}%`, transition:"width 0.4s" }} />
        </div>
      </div>

      {/* Quick stats */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:20 }}>
        {[
          { label:"Tasks done", value:`${done}/${tasks.length}`, sub:"today", color:C.saffron, icon:"✅" },
          { label:"Pending", value:`${tasks.filter(t=>!t.done).length}`, sub:"tasks left", color: tasks.filter(t=>!t.done).length > 0 ? C.kumkum : C.peacock, icon:"📋" },
          {
            label:"Monthly spent",
            value: salary ? `₹${totalSpent.toLocaleString("en-IN")}` : "—",
            sub: salary ? `of ₹${salary.toLocaleString("en-IN")}` : "set budget first",
            color: salary && totalSpent > salary ? C.kumkum : C.peacock,
            icon:"💰"
          },
        ].map(s => (
          <div key={s.label} style={{ background:C.card, borderRadius:14, padding:"12px 10px", border:`1.5px solid ${C.border}`, textAlign:"center" }}>
            <div style={{ fontSize:20, marginBottom:4 }}>{s.icon}</div>
            <div style={{ fontSize:14, fontWeight:700, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:10, color:C.muted, marginTop:2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Tasks */}
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
        <RangoliDot color={C.saffron} />
        <span style={{ fontFamily:"'Georgia',serif", fontSize:17, color:C.dark, fontStyle:"italic" }}>Today's To-Do</span>
      </div>

      <div style={{ background:C.card, borderRadius:16, border:`1.5px solid ${C.border}`, marginBottom:16, overflow:"hidden" }}>
        {tasks.map((t,i) => (
          <div key={t.id} onClick={()=>setTasks(ts=>ts.map(x=>x.id===t.id?{...x,done:!x.done}:x))}
            style={{
              display:"flex", alignItems:"center", gap:12, padding:"12px 14px",
              borderBottom: i<tasks.length-1 ? `1px solid ${C.border}` : "none",
              cursor:"pointer", opacity: t.done ? 0.5 : 1, transition:"opacity 0.2s",
              background: t.done ? C.sandal+"60" : "transparent",
            }}>
            <div style={{
              width:22, height:22, borderRadius:"50%", flexShrink:0,
              border:`2px solid ${t.done ? C.peacock : C.border}`,
              background: t.done ? C.peacock : "transparent",
              display:"flex", alignItems:"center", justifyContent:"center",
              transition:"all 0.2s",
            }}>
              {t.done && <span style={{ color:"#fff", fontSize:11 }}>✓</span>}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:14, color:C.dark, textDecoration: t.done?"line-through":"none" }}>{t.text}</div>
              <div style={{ fontSize:11, color:C.muted, marginTop:1 }}>{t.time}</div>
            </div>
            <span style={{ fontSize:16 }}>{catIcon[t.cat]||"📌"}</span>
          </div>
        ))}
      </div>

      {/* Add task */}
      <div style={{ display:"flex", gap:8, marginBottom:20 }}>
        <input value={newTask} onChange={e=>setNewTask(e.target.value)} onKeyDown={e=>{
          if(e.key==="Enter"&&newTask.trim()){
            setTasks(ts=>[...ts,{id:Date.now(),text:newTask,time:"",done:false,cat:"general"}]);
            setNewTask("");
          }
        }} placeholder="Add a task for today…"
          style={{ flex:1, border:`1.5px solid ${C.border}`, borderRadius:12, padding:"10px 14px", fontSize:13, outline:"none", background:C.jasmine, fontFamily:"inherit" }} />
        <button onClick={()=>{
          if(newTask.trim()){
            setTasks(ts=>[...ts,{id:Date.now(),text:newTask,time:"",done:false,cat:"general"}]);
            setNewTask("");
          }
        }} style={{ background:C.saffron, color:"#fff", border:"none", borderRadius:12, padding:"10px 18px", cursor:"pointer", fontWeight:700, fontSize:13 }}>
          Add
        </button>
      </div>

      <AiChat
        system={`You are Grihalakshmi, a warm and practical AI assistant for Indian housewives. Help with daily household management, task prioritisation, home organisation, and domestic advice. Be concise, warm, and culturally aware of Indian household customs. Today's tasks: ${JSON.stringify(tasks)}.`}
        placeholder="Ask me to help prioritise your day, suggest chores, or plan your schedule…"
        accent={C.saffron}
      />
    </div>
  );
}

// ── Meals ─────────────────────────────────────────────────────────────────
function MealsScreen() {
  const days = Object.keys(WEEK_MEALS);
  const todayIdx = Math.min(new Date().getDay() === 0 ? 6 : new Date().getDay()-1, 6);
  const [activeDay, setActiveDay] = useState(todayIdx);

  // Editable meal plan state
  const [meals, setMeals] = useState(
    Object.fromEntries(Object.entries(WEEK_MEALS).map(([d,m])=>[d,{...m}]))
  );

  // Edit modal state
  const [editModal, setEditModal] = useState(null); // { day, slot, value }

  // Grocery state
  const [grocery, setGrocery] = useState([
    "Onions (2 kg)","Tomatoes (1 kg)","Spinach","Paneer (500g)","Dal (1 kg)",
    "Curd (500ml)","Rice (5 kg)","Mustard seeds","Curry leaves","Ghee",
    "Atta (5 kg)","Coriander powder","Cumin seeds","Green chillies",
  ].map((t,i)=>({id:i,text:t,checked:false})));
  const [newGrocery, setNewGrocery] = useState("");

  const meal = meals[days[activeDay]];
  const slots = [
    { key:"b", label:"🌅 Breakfast" },
    { key:"l", label:"☀️ Lunch"     },
    { key:"d", label:"🌙 Dinner"    },
  ];

  const saveEdit = () => {
    if (!editModal) return;
    setMeals(m => ({
      ...m,
      [editModal.day]: { ...m[editModal.day], [editModal.slot]: editModal.value }
    }));
    setEditModal(null);
  };

  const addGrocery = () => {
    if (!newGrocery.trim()) return;
    setGrocery(g => [...g, { id: Date.now(), text: newGrocery.trim(), checked: false }]);
    setNewGrocery("");
  };

  const removeGrocery = (id) => setGrocery(g => g.filter(x => x.id !== id));
  const clearChecked = () => setGrocery(g => g.filter(x => !x.checked));
  const checkedCount = grocery.filter(x => x.checked).length;

  return (
    <div style={{ padding:"20px 18px 100px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
        <RangoliDot color={C.turmeric} />
        <span style={{ fontFamily:"'Georgia',serif", fontSize:20, color:C.dark, fontStyle:"italic" }}>Weekly Meal Planner</span>
      </div>

      {/* Day pills */}
      <div style={{ display:"flex", gap:6, overflowX:"auto", paddingBottom:8, marginBottom:16 }}>
        {days.map((d,i)=>(
          <button key={d} onClick={()=>setActiveDay(i)} style={{
            flexShrink:0, padding:"7px 14px", borderRadius:20, border:"none", cursor:"pointer", fontSize:13,
            background: activeDay===i ? C.turmeric : C.sandal,
            color: activeDay===i ? "#fff" : C.dark,
            fontWeight: activeDay===i ? 700 : 400, transition:"all 0.2s",
          }}>{d}</button>
        ))}
      </div>

      {/* Meals for day — each row is tappable to edit */}
      <div style={{ background:C.card, borderRadius:16, border:`1.5px solid ${C.border}`, marginBottom:16, overflow:"hidden" }}>
        {slots.map(({key,label},i)=>(
          <div key={key}
            onClick={()=>setEditModal({ day:days[activeDay], slot:key, value:meal[key] })}
            style={{
              display:"flex", alignItems:"center", justifyContent:"space-between",
              padding:"13px 16px", cursor:"pointer",
              borderBottom: i<slots.length-1 ? `1px solid ${C.border}` : "none",
              transition:"background 0.15s",
            }}
            onMouseEnter={e=>e.currentTarget.style.background=C.sandal+"80"}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}
          >
            <div>
              <div style={{ fontSize:11, color:C.muted, fontWeight:600, marginBottom:3 }}>{label}</div>
              <div style={{ fontSize:15, color:C.dark, fontWeight:500 }}>{meal[key]}</div>
            </div>
            <div style={{
              fontSize:11, color:C.turmeric, fontWeight:700,
              background:C.turmeric+"18", border:`1px solid ${C.turmeric}40`,
              borderRadius:8, padding:"4px 10px", flexShrink:0,
            }}>✏️ Edit</div>
          </div>
        ))}
      </div>

      {/* Edit modal */}
      {editModal && (
        <div style={{
          position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:200,
          display:"flex", alignItems:"flex-end", justifyContent:"center",
        }} onClick={()=>setEditModal(null)}>
          <div onClick={e=>e.stopPropagation()} style={{
            background:C.card, borderRadius:"20px 20px 0 0", padding:"24px 20px 36px",
            width:"100%", maxWidth:480, boxShadow:"0 -8px 30px rgba(0,0,0,0.2)",
          }}>
            <div style={{ width:40, height:4, background:C.border, borderRadius:4, margin:"0 auto 20px" }} />
            <div style={{ fontSize:12, color:C.muted, fontWeight:600, marginBottom:4, letterSpacing:"0.05em" }}>
              EDITING · {days[activeDay].toUpperCase()} · {slots.find(s=>s.key===editModal.slot)?.label}
            </div>
            <div style={{ fontFamily:"'Georgia',serif", fontSize:18, color:C.dark, fontStyle:"italic", marginBottom:16 }}>
              What's on the menu?
            </div>
            <input
              autoFocus
              value={editModal.value}
              onChange={e=>setEditModal(m=>({...m,value:e.target.value}))}
              onKeyDown={e=>e.key==="Enter"&&saveEdit()}
              placeholder="e.g. Poha + Chai"
              style={{
                width:"100%", border:`2px solid ${C.turmeric}`, borderRadius:12,
                padding:"12px 14px", fontSize:15, outline:"none", background:C.jasmine,
                fontFamily:"inherit", boxSizing:"border-box", marginBottom:14,
              }}
            />
            {/* Quick suggestions */}
            <div style={{ fontSize:11, color:C.muted, marginBottom:8, fontWeight:600 }}>QUICK SUGGESTIONS</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:20 }}>
              {(editModal.slot==="b"
                ? ["Poha","Upma","Idli + Sambar","Dosa","Paratha + Curd","Puri + Aloo","Bread + Egg"]
                : editModal.slot==="l"
                ? ["Dal + Rice","Rajma Chawal","Chole + Roti","Sambar Rice","Khichdi","Biryani","Pulao"]
                : ["Paneer Sabzi","Dal Makhani","Palak Paneer","Aloo Gobi","Fish Curry","Khichdi","Light Salad"]
              ).map(s=>(
                <div key={s} onClick={()=>setEditModal(m=>({...m,value:s}))}
                  style={{
                    padding:"5px 12px", borderRadius:20, fontSize:12, cursor:"pointer",
                    border:`1.5px solid ${editModal.value===s?C.turmeric:C.border}`,
                    background: editModal.value===s?C.turmeric+"20":C.sandal,
                    color: editModal.value===s?C.turmeric:C.dark,
                    transition:"all 0.15s",
                  }}>{s}</div>
              ))}
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={()=>setEditModal(null)} style={{
                flex:1, background:C.sandal, border:`1.5px solid ${C.border}`, borderRadius:12,
                padding:"12px", cursor:"pointer", fontSize:14, color:C.muted, fontWeight:600,
              }}>Cancel</button>
              <button onClick={saveEdit} style={{
                flex:2, background:C.turmeric, border:"none", borderRadius:12,
                padding:"12px", cursor:"pointer", fontSize:14, color:"#fff", fontWeight:700,
              }}>Save ✓</button>
            </div>
          </div>
        </div>
      )}

      {/* Grocery list */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <RangoliDot color={C.peacock} />
          <span style={{ fontFamily:"'Georgia',serif", fontSize:17, color:C.dark, fontStyle:"italic" }}>Saaman List</span>
        </div>
        <div style={{ display:"flex", gap:6, alignItems:"center" }}>
          <span style={{ fontSize:11, color:C.muted }}>{checkedCount}/{grocery.length} bought</span>
          {checkedCount > 0 && (
            <button onClick={clearChecked} style={{
              fontSize:10, background:C.kumkum+"18", color:C.kumkum, border:`1px solid ${C.kumkum}40`,
              borderRadius:8, padding:"3px 8px", cursor:"pointer", fontWeight:700,
            }}>Clear bought</button>
          )}
        </div>
      </div>

      {/* Add grocery input */}
      <div style={{ display:"flex", gap:8, marginBottom:12 }}>
        <input
          value={newGrocery}
          onChange={e=>setNewGrocery(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&addGrocery()}
          placeholder="Add item… e.g. Besan (500g)"
          style={{
            flex:1, border:`1.5px solid ${C.border}`, borderRadius:12,
            padding:"10px 14px", fontSize:13, outline:"none",
            background:C.jasmine, fontFamily:"inherit",
          }}
        />
        <button onClick={addGrocery} style={{
          background:C.peacock, color:"#fff", border:"none",
          borderRadius:12, padding:"10px 18px", cursor:"pointer", fontWeight:700, fontSize:13,
        }}>+ Add</button>
      </div>

      <div style={{ background:C.card, borderRadius:16, border:`1.5px solid ${C.border}`, padding:14, marginBottom:20 }}>
        {grocery.length === 0 && (
          <div style={{ fontSize:13, color:C.muted, fontStyle:"italic", textAlign:"center", padding:"8px 0" }}>
            Your saaman list is empty. Add items above!
          </div>
        )}
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          {grocery.map(item=>(
            <div key={item.id} style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div
                onClick={()=>setGrocery(g=>g.map(x=>x.id===item.id?{...x,checked:!x.checked}:x))}
                style={{
                  flex:1, display:"flex", alignItems:"center", gap:10,
                  padding:"8px 12px", borderRadius:10, cursor:"pointer",
                  border:`1.5px solid ${item.checked?C.peacock:C.border}`,
                  background: item.checked ? C.peacock+"12" : C.jasmine,
                  transition:"all 0.2s",
                }}>
                <div style={{
                  width:18, height:18, borderRadius:4, flexShrink:0,
                  border:`2px solid ${item.checked?C.peacock:C.border}`,
                  background: item.checked?C.peacock:"transparent",
                  display:"flex", alignItems:"center", justifyContent:"center",
                }}>
                  {item.checked && <span style={{ color:"#fff", fontSize:10 }}>✓</span>}
                </div>
                <span style={{
                  fontSize:13, color: item.checked?C.muted:C.dark,
                  textDecoration: item.checked?"line-through":"none",
                  flex:1,
                }}>{item.text}</span>
              </div>
              <button onClick={()=>removeGrocery(item.id)} style={{
                background:"none", border:`1.5px solid ${C.border}`, borderRadius:8,
                width:30, height:30, cursor:"pointer", color:C.muted, fontSize:14,
                display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
              }}>×</button>
            </div>
          ))}
        </div>
      </div>

      <AiChat
        system="You are a knowledgeable Indian recipe assistant. Help with traditional and modern Indian recipes, meal planning for Indian families, ingredient substitutions, tiffin ideas for kids, festival special dishes, and quick cooking tips. Include specific Indian ingredients, masalas, and cooking techniques. Be warm and practical."
        placeholder="Ask for recipe ideas, what to cook with leftover dal, quick tiffin for kids, festival specials…"
        accent={C.turmeric}
      />
    </div>
  );
}

// ── Festivals ─────────────────────────────────────────────────────────────
const PROMINENT_FESTIVALS = [
  // ── January ──
  { name:"New Year's Day",        fullDate:"2027-01-01", color:"#E74C3C",  icon:"🎆", tasks:["Plan resolutions","Family get-together","Special dinner","Watch fireworks"] },
  { name:"Lohri",                 fullDate:"2027-01-13", color:C.saffron,  icon:"🔥", tasks:["Bonfire preparation","Buy rewri & popcorn","Sing Lohri songs","Distribute prasad"] },
  { name:"Makar Sankranti",       fullDate:"2027-01-14", color:C.turmeric, icon:"🪁", tasks:["Fly kites","Prepare til-gul / pongal","Take holy dip","Donate sesame & jaggery"] },
  { name:"Pongal",                fullDate:"2027-01-14", color:C.peacock,  icon:"🍚", tasks:["Cook sweet pongal","Decorate with kolam","Worship sun","Clean & decorate home"] },
  { name:"Republic Day",          fullDate:"2027-01-26", color:C.indigo,   icon:"🇮🇳", tasks:["Watch parade on TV","Hoist flag","Teach kids about Constitution","Community event"] },

  // ── February ──
  { name:"Valentine's Day",       fullDate:"2027-02-14", color:"#E91E63",  icon:"❤️", tasks:["Plan special dinner","Buy flowers or gift","Write a love note","Bake something sweet"] },
  { name:"Maha Shivratri",        fullDate:"2027-02-17", color:"#607D8B",  icon:"🔱", tasks:["Keep fast","Visit Shiva temple","Prepare bel patra & milk","Night jagran","Offer prasad"] },

  // ── March ──
  { name:"Holi",                  fullDate:"2027-03-01", color:"#FF69B4",  icon:"🎨", tasks:["Buy colours & pichkari","Prepare gujiya & thandai","Holika Dahan night before","Wear white clothes","Invite neighbours"] },
  { name:"Holika Dahan",          fullDate:"2027-02-28", color:C.saffron,  icon:"🔥", tasks:["Collect wood for bonfire","Evening pooja","Apply tilak","Distribute prasad"] },
  { name:"Women's Day",           fullDate:"2027-03-08", color:"#9C27B0",  icon:"👩", tasks:["Celebrate the women at home","Plan a treat","Share appreciation","Family outing"] },
  { name:"Ugadi / Gudi Padwa",    fullDate:"2027-03-19", color:C.turmeric, icon:"🌅", tasks:["Make Pachadi / Puran Poli","Buy new clothes","Draw Rangoli","Arrange neem leaves & jaggery","Visit temple"] },

  // ── April ──
  { name:"Ram Navami",            fullDate:"2027-03-27", color:C.saffron,  icon:"🙏", tasks:["Prepare Panchamrit","Keep fast & do pooja","Distribute prasad","Read Ramcharitmanas"] },
  { name:"Good Friday",           fullDate:"2027-04-02", color:"#795548",  icon:"✝️", tasks:["Church service","Fast & prayer","Quiet family time"] },
  { name:"Easter",                fullDate:"2027-04-04", color:"#8BC34A",  icon:"🐣", tasks:["Easter egg hunt for kids","Special meal","Church mass","Bake hot cross buns"] },
  { name:"Dr. Ambedkar Jayanti",  fullDate:"2027-04-14", color:C.indigo,   icon:"📘", tasks:["Visit memorial","Read about Ambedkar","Community service","Hoist flag"] },
  { name:"Akshaya Tritiya",       fullDate:"2027-04-18", color:C.marigold, icon:"✨", tasks:["Buy gold or silver","Give to charity","Special lakshmi pooja","Prepare kheer"] },

  // ── May ──
  { name:"Mother's Day",          fullDate:"2027-05-09", color:"#E91E63",  icon:"💐", tasks:["Breakfast in bed for mum","Buy flowers or gift","Plan family outing","Write a heartfelt card"] },
  { name:"Buddha Purnima",        fullDate:"2027-05-23", color:"#FF9800",  icon:"☸️", tasks:["Visit Buddhist temple","Light candles","Read Buddhist teachings","Donate to charity"] },

  // ── June ──
  { name:"Eid ul-Adha",           fullDate:"2027-05-27", color:C.peacock,  icon:"🌙", tasks:["Prepare Biryani & Sheer Khurma","Buy new clothes","Eidi for children","Visit relatives & neighbours"] },
  { name:"Father's Day",          fullDate:"2027-06-20", color:C.indigo,   icon:"👨", tasks:["Special breakfast for dad","Buy a gift","Plan family outing","Write appreciation card"] },
  { name:"Rath Yatra",            fullDate:"2027-06-28", color:C.saffron,  icon:"🎪", tasks:["Prepare for procession","Make khichdi prasad","Visit temple","Watch rath yatra"] },

  // ── July ──
  { name:"Guru Purnima",          fullDate:"2027-07-12", color:C.turmeric, icon:"🙏", tasks:["Honour your teacher / guru","Visit ashram or temple","Read spiritual texts","Offer flowers & prasad"] },

  // ── August ──
  { name:"Independence Day",      fullDate:"2027-08-15", color:C.indigo,   icon:"🇮🇳", tasks:["Hoist flag at home","Watch parade on TV","Teach kids freedom history","Community event"] },
  { name:"Raksha Bandhan",        fullDate:"2027-08-22", color:"#9B59B6",  icon:"🪢", tasks:["Buy rakhi","Prepare mithai","Cook brother's favourite meal","Gift for sibling"] },
  { name:"Janmashtami",           fullDate:"2027-08-24", color:C.peacock,  icon:"🦚", tasks:["Decorate jhula for Krishna","Midnight pooja","Prepare 56 bhog","Dahi handi","Fast till midnight"] },
  { name:"Ganesh Chaturthi",      fullDate:"2027-09-10", color:C.saffron,  icon:"🐘", tasks:["Install Ganesh idol","Prepare modak","Decorate mandap","Arrange flowers & diyas","Visarjan planning"] },

  // ── September / October ──
  { name:"Navratri",              fullDate:"2027-10-09", color:C.kumkum,   icon:"🪷", tasks:["Buy new outfit for garba","Prepare satvik fasting food","Arrange dandiya sticks","Kanya pooja on Ashtami"] },
  { name:"Dussehra",              fullDate:"2027-10-18", color:C.clay,     icon:"🏹", tasks:["Watch Ramlila","Buy new vehicle or appliances","Shami puja","Visit Dussehra mela with kids"] },
  { name:"Karva Chauth",          fullDate:"2027-10-27", color:C.kumkum,   icon:"🌕", tasks:["Keep fast from sunrise","Dress in bridal attire","Evening pooja with thali","Moon sighting & break fast"] },

  // ── November ──
  { name:"Dhanteras",             fullDate:"2027-11-05", color:C.marigold, icon:"🪙", tasks:["Buy gold, silver or utensils","Lakshmi pooja in evening","Light diyas at entrance","Prepare sweets"] },
  { name:"Diwali",                fullDate:"2027-11-07", color:C.marigold, icon:"🪔", tasks:["Deep clean the entire house","Buy diyas, lights & crackers","Prepare mithai & namkeen","Lakshmi pooja","New clothes for everyone","Send gifts to relatives"] },
  { name:"Bhai Dooj",             fullDate:"2027-11-09", color:C.turmeric, icon:"🌸", tasks:["Cook brother's favourite food","Apply tilak","Exchange gifts","Invite brother home"] },
  { name:"Chhath Puja",           fullDate:"2027-11-11", color:C.saffron,  icon:"🌅", tasks:["Prepare thekua & prasad","Ghat decoration","Evening arghya to setting sun","Morning arghya to rising sun","Keep fast"] },
  { name:"Guru Nanak Jayanti",    fullDate:"2027-11-20", color:C.marigold, icon:"🕌", tasks:["Visit Gurudwara","Participate in langar","Read Gurbani","Serve community"] },

  // ── December ──
  { name:"Christmas",             fullDate:"2027-12-25", color:C.peacock,  icon:"🎄", tasks:["Decorate home & tree","Bake or buy plum cake","Attend midnight mass","Exchange gifts with family","Prepare special meal"] },
  { name:"New Year's Eve",        fullDate:"2027-12-31", color:"#E74C3C",  icon:"🎊", tasks:["Plan party or outing","Buy sparklers","Prepare special dinner","Family countdown","Write year-end reflections"] },
];

// Gets the next upcoming occurrence of a festival date (rolls to next year if passed)
function getNextOccurrence(fullDate) {
  const today = new Date(); today.setHours(0,0,0,0);
  const d = new Date(fullDate); d.setHours(0,0,0,0);
  // If date is still upcoming this year or today, use it as-is
  if (d >= today) return d;
  // Already passed — roll to next year
  const next = new Date(d);
  next.setFullYear(today.getFullYear() + 1);
  return next;
}

function getDaysAway(fullDate) {
  const today = new Date(); today.setHours(0,0,0,0);
  const next = getNextOccurrence(fullDate);
  return Math.round((next - today) / 86400000);
}

// Returns the display date string using the next upcoming occurrence
function getDisplayDate(fullDate) {
  return getNextOccurrence(fullDate).toLocaleDateString("en-IN", {
    weekday:"long", day:"numeric", month:"long", year:"numeric"
  });
}

// Returns festivals sorted: fewest days away first (all auto-roll so none are truly "passed")
function getSortedFestivals(festivals) {
  return [...festivals].sort((a, b) => getDaysAway(a.fullDate) - getDaysAway(b.fullDate));
}

function FestivalScreen() {
  const [allFestivals, setAllFestivals] = useState(
    PROMINENT_FESTIVALS.map(f => ({ ...f, custom: false, tasks: f.tasks.map((t,i)=>({id:i,text:t,done:false})) }))
  );
  const [selected, setSelected]     = useState(0);
  const [calView, setCalView]        = useState(false);
  const [addModal, setAddModal]      = useState(false);
  const [newFest, setNewFest]        = useState({ name:"", fullDate:"", icon:"🎉", color:C.kumkum, note:"" });
  const [newTask, setNewTask]        = useState("");

  // ── Birthdays ──
  const [birthdays,    setBirthdays]    = useState([]);
  const [bdayModal,    setBdayModal]    = useState(false);
  const [editBday,     setEditBday]     = useState(null); // null = adding, else index
  const [bdayDraft,    setBdayDraft]    = useState({ name:"", date:"", relation:"", note:"", icon:"🎂" });

  const bdayRelations = ["Family","Husband","Parent","Sibling","Child","Friend","Colleague","Other"];
  const bdayIcons     = ["🎂","🎁","🎈","💐","👶","👦","👧","👨","👩","👴","👵","💑","👫"];

  // Next birthday calculation — finds the next occurrence this/next year
  function getNextBirthday(dateStr) {
    if (!dateStr) return null;
    const today = new Date(); today.setHours(0,0,0,0);
    const [,month,day] = dateStr.split("-").map(Number);
    let next = new Date(today.getFullYear(), month-1, day);
    if (next < today) next = new Date(today.getFullYear()+1, month-1, day);
    return next;
  }
  function getBdayDays(dateStr) {
    if (!dateStr) return null;
    const today = new Date(); today.setHours(0,0,0,0);
    const next = getNextBirthday(dateStr);
    return Math.round((next - today) / 86400000);
  }
  function getBdayAge(dateStr) {
    if (!dateStr) return null;
    const [year] = dateStr.split("-").map(Number);
    if (!year || year < 1900) return null;
    const next = getNextBirthday(dateStr);
    return next.getFullYear() - year;
  }

  const sortedBirthdays = [...birthdays].sort((a,b) => (getBdayDays(a.date)||999) - (getBdayDays(b.date)||999));

  const openAddBday  = () => { setBdayDraft({ name:"", date:"", relation:"Family", note:"", icon:"🎂" }); setEditBday(null); setBdayModal(true); };
  const openEditBday = (i) => { setBdayDraft({...sortedBirthdays[i]}); setEditBday(i); setBdayModal(true); };
  const saveBday = () => {
    if (!bdayDraft.name.trim() || !bdayDraft.date) return;
    if (editBday !== null) {
      const orig = sortedBirthdays[editBday];
      setBirthdays(bs => bs.map(b => b.name===orig.name && b.date===orig.date ? bdayDraft : b));
    } else {
      setBirthdays(bs => [...bs, { ...bdayDraft }]);
    }
    setBdayModal(false);
  };
  const deleteBday = (i) => {
    const orig = sortedBirthdays[i];
    setBirthdays(bs => bs.filter(b => !(b.name===orig.name && b.date===orig.date)));
    setBdayModal(false);
  };

  // Always show sorted — most upcoming first
  const sortedFestivals = getSortedFestivals(allFestivals);

  // Calendar state
  const now = new Date();
  const [calYear,  setCalYear]  = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth()); // 0-indexed

  const fest  = sortedFestivals[selected] || sortedFestivals[0];
  const daysAway = getDaysAway(fest.fullDate);

  const toggleCheck = (idx) => {
    setAllFestivals(fs => fs.map(f =>
      f.name===fest.name ? { ...f, tasks: f.tasks.map((t,ti)=> ti===idx ? {...t,done:!t.done} : t) } : f
    ));
  };
  const addTaskToFest = () => {
    if (!newTask.trim()) return;
    setAllFestivals(fs => fs.map(f =>
      f.name===fest.name ? { ...f, tasks:[...f.tasks,{id:Date.now(),text:newTask.trim(),done:false}] } : f
    ));
    setNewTask("");
  };
  const removeTask = (tid) => {
    setAllFestivals(fs => fs.map(f =>
      f.name===fest.name ? { ...f, tasks: f.tasks.filter(t=>t.id!==tid) } : f
    ));
  };
  const addCustomFestival = () => {
    if (!newFest.name.trim() || !newFest.fullDate) return;
    const entry = { ...newFest, custom:true, tasks:[{ id:1, text:"Prepare & celebrate", done:false }] };
    setAllFestivals(fs => [...fs, entry]);
    setSelected(0); // jump to top (sorted will put it in right place)
    setNewFest({ name:"", fullDate:"", icon:"🎉", color:C.kumkum, note:"" });
    setAddModal(false);
  };
  const removeCustomFestival = () => {
    setAllFestivals(fs => fs.filter(f => f.name!==fest.name));
    setSelected(0);
  };

  // Calendar helpers
  const calDays = () => {
    const first = new Date(calYear, calMonth, 1).getDay();
    const total = new Date(calYear, calMonth+1, 0).getDate();
    return { first, total };
  };
  const festsThisMonth = allFestivals.filter(f => {
    const d = new Date(f.fullDate);
    return d.getFullYear()===calYear && d.getMonth()===calMonth;
  });
  const festOnDay = (day) => festsThisMonth.filter(f => new Date(f.fullDate).getDate()===day);
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  const { first, total } = calDays();
  const iconOptions = ["🎉","🪔","🙏","🌸","🥁","🌺","🎊","⭐","🌙","🏹","🪷","🎄","🥳","🌅","🪢"];
  const colorOptions = [C.kumkum, C.turmeric, C.saffron, C.peacock, C.indigo, "#9B59B6", C.clay, C.marigold];

  return (
    <div style={{ padding:"20px 18px 100px" }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <RangoliDot color={C.kumkum} />
          <span style={{ fontFamily:"'Georgia',serif", fontSize:20, color:C.dark, fontStyle:"italic" }}>Festival Planner</span>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={()=>setCalView(v=>!v)} style={{
            fontSize:11, fontWeight:700, padding:"6px 12px", borderRadius:10, cursor:"pointer",
            background: calView ? C.kumkum : C.sandal,
            color: calView ? "#fff" : C.dark,
            border:`1.5px solid ${calView?C.kumkum:C.border}`,
          }}>{calView ? "📋 List" : "📅 Calendar"}</button>
          <button onClick={()=>setAddModal(true)} style={{
            fontSize:11, fontWeight:700, padding:"6px 12px", borderRadius:10, cursor:"pointer",
            background:C.kumkum, color:"#fff", border:"none",
          }}>+ Add</button>
        </div>
      </div>

      {/* ── CALENDAR VIEW ── */}
      {calView && (
        <div style={{ background:C.card, borderRadius:16, border:`1.5px solid ${C.border}`, marginBottom:16, overflow:"hidden" }}>
          {/* Month nav */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 16px", background:C.kumkum }}>
            <button onClick={()=>{ if(calMonth===0){setCalMonth(11);setCalYear(y=>y-1);}else setCalMonth(m=>m-1); }}
              style={{ background:"none", border:"none", color:"#fff", fontSize:18, cursor:"pointer", padding:"0 8px" }}>‹</button>
            <span style={{ fontFamily:"'Georgia',serif", fontSize:16, color:"#fff", fontStyle:"italic" }}>
              {monthNames[calMonth]} {calYear}
            </span>
            <button onClick={()=>{ if(calMonth===11){setCalMonth(0);setCalYear(y=>y+1);}else setCalMonth(m=>m+1); }}
              style={{ background:"none", border:"none", color:"#fff", fontSize:18, cursor:"pointer", padding:"0 8px" }}>›</button>
          </div>
          {/* Day headers */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", background:C.sandal }}>
            {["S","M","T","W","T","F","S"].map((d,i)=>(
              <div key={i} style={{ textAlign:"center", fontSize:10, fontWeight:700, color:C.muted, padding:"6px 0" }}>{d}</div>
            ))}
          </div>
          {/* Days grid */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:1, background:C.border }}>
            {Array.from({length: first}).map((_,i)=>(
              <div key={"e"+i} style={{ background:C.jasmine, minHeight:44 }} />
            ))}
            {Array.from({length: total}).map((_,i)=>{
              const day = i+1;
              const fests = festOnDay(day);
              const isToday = now.getDate()===day && now.getMonth()===calMonth && now.getFullYear()===calYear;
              return (
                <div key={day} style={{
                  background:C.jasmine, minHeight:44, padding:"4px 3px",
                  position:"relative", cursor: fests.length?"pointer":"default",
                }} onClick={()=>{ if(fests.length){ const idx=sortedFestivals.findIndex(f=>f.name===fests[0].name); setSelected(idx>=0?idx:0); setCalView(false); } }}>
                  <div style={{
                    width:22, height:22, borderRadius:"50%", display:"flex", alignItems:"center",
                    justifyContent:"center", fontSize:12, fontWeight: isToday?700:400,
                    background: isToday ? C.kumkum : "transparent",
                    color: isToday ? "#fff" : C.dark,
                    margin:"0 auto 2px",
                  }}>{day}</div>
                  {fests.map((f,fi)=>(
                    <div key={fi} style={{
                      fontSize:8, background:f.color+"25", color:f.color,
                      borderRadius:4, padding:"1px 3px", fontWeight:700,
                      whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
                      marginBottom:1, lineHeight:1.4,
                    }}>{f.icon} {f.name.split("/")[0].trim()}</div>
                  ))}
                </div>
              );
            })}
          </div>
          {/* Legend */}
          {festsThisMonth.length > 0 && (
            <div style={{ padding:"10px 14px", borderTop:`1px solid ${C.border}` }}>
              <div style={{ fontSize:11, color:C.muted, fontWeight:600, marginBottom:6 }}>THIS MONTH</div>
              {festsThisMonth.map((f,i)=>(
                <div key={i} onClick={()=>{ setSelected(sortedFestivals.findIndex(sf=>sf.name===f.name)); setCalView(false); }}
                  style={{ display:"flex", alignItems:"center", gap:8, padding:"4px 0", cursor:"pointer" }}>
                  <span style={{ fontSize:14 }}>{f.icon}</span>
                  <span style={{ fontSize:12, color:C.dark, fontWeight:500 }}>{f.name}</span>
                  <span style={{ fontSize:11, color:f.color, marginLeft:"auto", fontWeight:700 }}>
                    {getNextOccurrence(f.fullDate).getDate()} {monthNames[calMonth].slice(0,3)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── LIST VIEW ── */}
      {!calView && (
        <>
          {/* Scrollable festival chips */}
          <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:8, marginBottom:16 }}>
            {sortedFestivals.map((f,i)=>{
              const d = getDaysAway(f.fullDate);
              return (
                <div key={i} onClick={()=>setSelected(i)} style={{
                  flexShrink:0, width:116, borderRadius:14,
                  border:`2px solid ${selected===i ? f.color : C.border}`,
                  background: selected===i ? f.color+"15" : C.card,
                  padding:"10px 8px", cursor:"pointer", transition:"all 0.2s", textAlign:"center",
                }}>
                  <div style={{ fontSize:24, marginBottom:3 }}>{f.icon}</div>
                  <div style={{ fontSize:10, fontWeight:700, color: selected===i?f.color:C.dark, lineHeight:1.3 }}>{f.name.split("/")[0].trim()}</div>
                  <div style={{ fontSize:9, color:C.muted, marginTop:3 }}>
                    {getNextOccurrence(f.fullDate).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}
                  </div>
                  <div style={{ marginTop:4, fontSize:9, fontWeight:700, color: d<=0?C.peacock:d<=14?C.kumkum:d<=45?C.turmeric:C.muted }}>
                    {d<0?"Passed":d===0?"Today 🎉":`${d}d away`}
                  </div>
                  {f.custom && (
                    <div style={{ fontSize:8, color:C.muted, marginTop:2 }}>★ My festival</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Selected festival detail */}
          <div style={{
            background:`linear-gradient(135deg, ${fest.color}15, ${fest.color}04)`,
            borderRadius:20, border:`2px solid ${fest.color}35`, padding:"16px 16px", marginBottom:16,
          }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:20, fontFamily:"'Georgia',serif", fontStyle:"italic", color:C.dark }}>
                  {fest.icon} {fest.name}
                </div>
                <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>
                  {getDisplayDate(fest.fullDate)}
                  {" · "}
                  {daysAway === 0 ? "🎉 Today!" : `${daysAway} days to go`}
                </div>
                {fest.note && <div style={{ fontSize:12, color:fest.color, marginTop:4, fontStyle:"italic" }}>{fest.note}</div>}
              </div>
              <div style={{ textAlign:"center", minWidth:44 }}>
                <div style={{ fontSize:18, fontWeight:700, color:fest.color }}>
                  {fest.tasks.filter(t=>t.done).length}/{fest.tasks.length}
                </div>
                <div style={{ fontSize:9, color:C.muted }}>done</div>
              </div>
            </div>
            {/* Progress bar */}
            {fest.tasks.length > 0 && (
              <div style={{ background:"rgba(0,0,0,0.07)", borderRadius:10, height:5, marginBottom:14 }}>
                <div style={{ background:fest.color, borderRadius:10, height:5, transition:"width 0.3s",
                  width:`${(fest.tasks.filter(t=>t.done).length/fest.tasks.length)*100}%` }} />
              </div>
            )}
            {/* Checklist */}
            <div style={{ fontSize:11, fontWeight:700, color:fest.color, marginBottom:8, letterSpacing:"0.05em" }}>
              PREPARATION CHECKLIST
            </div>
            {fest.tasks.map((t,i)=>(
              <div key={t.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 0",
                borderBottom: i<fest.tasks.length-1?`1px dashed ${fest.color}25`:"none" }}>
                <div onClick={()=>toggleCheck(i)} style={{
                  width:20, height:20, borderRadius:"50%", flexShrink:0, cursor:"pointer",
                  border:`2px solid ${t.done?fest.color:C.border}`,
                  background: t.done?fest.color:"transparent",
                  display:"flex", alignItems:"center", justifyContent:"center",
                }}>
                  {t.done && <span style={{ color:"#fff", fontSize:10 }}>✓</span>}
                </div>
                <span onClick={()=>toggleCheck(i)} style={{ fontSize:13, flex:1, color:C.dark,
                  textDecoration:t.done?"line-through":"none", cursor:"pointer" }}>{t.text}</span>
                <button onClick={()=>removeTask(t.id)} style={{
                  background:"none", border:"none", color:C.muted, cursor:"pointer", fontSize:14, padding:"0 2px",
                }}>×</button>
              </div>
            ))}
            {/* Add task to this festival */}
            <div style={{ display:"flex", gap:6, marginTop:10 }}>
              <input value={newTask} onChange={e=>setNewTask(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&addTaskToFest()}
                placeholder="Add a preparation task…"
                style={{ flex:1, border:`1.5px solid ${fest.color}60`, borderRadius:10, padding:"7px 10px",
                  fontSize:12, outline:"none", background:"rgba(255,255,255,0.7)", fontFamily:"inherit" }} />
              <button onClick={addTaskToFest} style={{
                background:fest.color, color:"#fff", border:"none", borderRadius:10,
                padding:"7px 14px", cursor:"pointer", fontSize:13, fontWeight:700,
              }}>+</button>
            </div>
            {/* Delete custom festival */}
            {fest.custom && (
              <button onClick={()=>removeCustomFestival()} style={{
                marginTop:12, fontSize:11, color:C.kumkum, background:"none",
                border:`1px solid ${C.kumkum}50`, borderRadius:8, padding:"4px 12px", cursor:"pointer",
              }}>🗑 Remove this festival</button>
            )}
          </div>
        </>
      )}

      <AiChat
        system="You are an expert on Indian festivals, rituals, and traditions. Help with pooja preparation, rituals for all major Indian festivals (Hindu, Muslim, Sikh, Christian, Jain, Buddhist), shopping lists, prasad recipes, decoration ideas, fasting food, and religious significance. Cover festivals across all Indian states and communities. Be respectful and informative."
        placeholder="Ask about pooja vidhi, prasad recipes, fasting foods, what to do for Navratri, Onam, Pongal…"
        accent={fest.color}
      />

      {/* ── BIRTHDAYS SECTION ── */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", margin:"20px 0 12px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <RangoliDot color={"#E91E63"} />
          <span style={{ fontFamily:"'Georgia',serif", fontSize:18, color:C.dark, fontStyle:"italic" }}>Birthdays 🎂</span>
        </div>
        <button onClick={openAddBday} style={{
          fontSize:11, fontWeight:700, padding:"7px 14px", borderRadius:10,
          background:"#E91E63", color:"#fff", border:"none", cursor:"pointer",
        }}>+ Add Birthday</button>
      </div>

      {sortedBirthdays.length === 0 ? (
        <div style={{ background:C.card, borderRadius:16, border:`1.5px dashed ${C.border}`, padding:"24px", textAlign:"center", marginBottom:20 }}>
          <div style={{ fontSize:36, marginBottom:8 }}>🎂</div>
          <div style={{ fontSize:13, color:C.muted, fontStyle:"italic" }}>No birthdays added yet. Add your loved ones' birthdays!</div>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:20 }}>
          {sortedBirthdays.map((b, i) => {
            const days = getBdayDays(b.date);
            const age  = getBdayAge(b.date);
            const isToday   = days === 0;
            const isSoon    = days !== null && days <= 7 && days > 0;
            return (
              <div key={i} onClick={()=>openEditBday(i)} style={{
                background: isToday ? "#E91E63"+"15" : C.card,
                borderRadius:16, border:`1.5px solid ${isToday?"#E91E63":isSoon?"#FF9800":C.border}`,
                padding:"14px 16px", cursor:"pointer", display:"flex", gap:12, alignItems:"center",
                transition:"all 0.2s",
              }}>
                {/* Avatar */}
                <div style={{
                  width:46, height:46, borderRadius:"50%", flexShrink:0,
                  background: isToday ? "#E91E63" : "#E91E63"+"20",
                  display:"flex", alignItems:"center", justifyContent:"center", fontSize:22,
                  border:`2px solid ${isToday?"#E91E63":"#E91E6340"}`,
                }}>{b.icon || "🎂"}</div>

                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:15, fontWeight:700, color:C.dark }}>{b.name}</div>
                  <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>
                    {b.relation && <span style={{ background:"#E91E6318", color:"#E91E63", borderRadius:8, padding:"1px 7px", fontWeight:600, marginRight:6 }}>{b.relation}</span>}
                    {new Date(b.date).toLocaleDateString("en-IN",{day:"numeric", month:"long"})}
                    {age && ` · Turns ${age}`}
                  </div>
                  {b.note && <div style={{ fontSize:11, color:C.muted, marginTop:3, fontStyle:"italic" }}>"{b.note}"</div>}
                </div>

                <div style={{ textAlign:"center", flexShrink:0 }}>
                  {isToday ? (
                    <div style={{ fontSize:11, fontWeight:800, color:"#E91E63" }}>🎉 Today!</div>
                  ) : days !== null ? (
                    <>
                      <div style={{ fontSize:16, fontWeight:700, color: isSoon?"#FF9800":C.muted }}>{days}</div>
                      <div style={{ fontSize:9, color:C.muted }}>days</div>
                    </>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── BIRTHDAY MODAL ── */}
      {bdayModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:200,
          display:"flex", alignItems:"flex-end", justifyContent:"center" }}
          onClick={()=>setBdayModal(false)}>
          <div onClick={e=>e.stopPropagation()} style={{
            background:C.card, borderRadius:"20px 20px 0 0",
            padding:"22px 20px 40px", width:"100%", maxWidth:480,
            boxShadow:"0 -8px 30px rgba(0,0,0,0.2)", maxHeight:"90vh", overflowY:"auto",
          }}>
            <div style={{ width:40, height:4, background:C.border, borderRadius:4, margin:"0 auto 18px" }} />
            <div style={{ fontFamily:"'Georgia',serif", fontSize:19, color:C.dark, fontStyle:"italic", marginBottom:18 }}>
              {editBday !== null ? "✏️ Edit Birthday" : "🎂 Add a Birthday"}
            </div>

            {/* Icon picker */}
            <div style={{ fontSize:10, color:C.muted, fontWeight:700, marginBottom:8, letterSpacing:"0.05em" }}>PICK AN ICON</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:16 }}>
              {bdayIcons.map(ic=>(
                <div key={ic} onClick={()=>setBdayDraft(d=>({...d,icon:ic}))} style={{
                  width:36, height:36, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:20, cursor:"pointer",
                  border:`2px solid ${bdayDraft.icon===ic?"#E91E63":C.border}`,
                  background: bdayDraft.icon===ic?"#E91E6315":C.sandal,
                }}>{ic}</div>
              ))}
            </div>

            {/* Name */}
            <div style={{ fontSize:10, color:C.muted, fontWeight:700, marginBottom:5, letterSpacing:"0.05em" }}>PERSON'S NAME *</div>
            <input value={bdayDraft.name} onChange={e=>setBdayDraft(d=>({...d,name:e.target.value}))}
              placeholder="e.g. Maa, Priya, Rahul…"
              style={{ width:"100%", border:`1.5px solid ${C.border}`, borderRadius:12, padding:"10px 14px",
                fontSize:14, outline:"none", background:C.jasmine, fontFamily:"inherit",
                boxSizing:"border-box", marginBottom:14 }} />

            {/* Date — full date with year for age calculation */}
            <div style={{ fontSize:10, color:C.muted, fontWeight:700, marginBottom:5, letterSpacing:"0.05em" }}>DATE OF BIRTH *</div>
            <input type="date" value={bdayDraft.date} onChange={e=>setBdayDraft(d=>({...d,date:e.target.value}))}
              style={{ width:"100%", border:`1.5px solid ${C.border}`, borderRadius:12, padding:"10px 14px",
                fontSize:14, outline:"none", background:C.jasmine, fontFamily:"inherit",
                boxSizing:"border-box", marginBottom:14 }} />

            {/* Relation */}
            <div style={{ fontSize:10, color:C.muted, fontWeight:700, marginBottom:8, letterSpacing:"0.05em" }}>RELATION</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:7, marginBottom:14 }}>
              {bdayRelations.map(r=>(
                <button key={r} onClick={()=>setBdayDraft(d=>({...d,relation:r}))} style={{
                  padding:"6px 14px", borderRadius:20, border:"none", cursor:"pointer", fontSize:12,
                  background: bdayDraft.relation===r ? "#E91E63" : C.sandal,
                  color: bdayDraft.relation===r ? "#fff" : C.dark,
                  fontWeight: bdayDraft.relation===r ? 700 : 400, transition:"all 0.2s",
                }}>{r}</button>
              ))}
            </div>

            {/* Note */}
            <div style={{ fontSize:10, color:C.muted, fontWeight:700, marginBottom:5, letterSpacing:"0.05em" }}>NOTE / REMINDER</div>
            <input value={bdayDraft.note} onChange={e=>setBdayDraft(d=>({...d,note:e.target.value}))}
              placeholder="e.g. Book a cake, call in the morning, plan dinner…"
              style={{ width:"100%", border:`1.5px solid ${C.border}`, borderRadius:12, padding:"10px 14px",
                fontSize:13, outline:"none", background:C.jasmine, fontFamily:"inherit",
                boxSizing:"border-box", marginBottom:20 }} />

            <div style={{ display:"flex", gap:10 }}>
              <button onClick={()=>setBdayModal(false)} style={{
                flex:1, background:C.sandal, border:`1.5px solid ${C.border}`, borderRadius:12,
                padding:"12px", cursor:"pointer", fontSize:13, color:C.muted, fontWeight:600,
              }}>Cancel</button>
              <button onClick={saveBday} disabled={!bdayDraft.name.trim()||!bdayDraft.date} style={{
                flex:2, background:bdayDraft.name.trim()&&bdayDraft.date?"#E91E63":C.muted,
                border:"none", borderRadius:12, padding:"12px",
                cursor:bdayDraft.name.trim()&&bdayDraft.date?"pointer":"not-allowed",
                fontSize:14, color:"#fff", fontWeight:700,
              }}>Save Birthday 🎂</button>
            </div>

            {editBday !== null && (
              <button onClick={()=>deleteBday(editBday)} style={{
                marginTop:12, width:"100%", background:"none", border:`1px solid ${C.kumkum}50`,
                borderRadius:12, padding:"10px", cursor:"pointer", color:C.kumkum, fontSize:12, fontWeight:600,
              }}>🗑 Remove this birthday</button>
            )}
          </div>
        </div>
      )}

      {/* ── ADD CUSTOM FESTIVAL MODAL ── */}
      {addModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:200,
          display:"flex", alignItems:"flex-end", justifyContent:"center" }}
          onClick={()=>setAddModal(false)}>
          <div onClick={e=>e.stopPropagation()} style={{
            background:C.card, borderRadius:"20px 20px 0 0",
            padding:"22px 20px 38px", width:"100%", maxWidth:480,
            boxShadow:"0 -8px 30px rgba(0,0,0,0.2)", maxHeight:"85vh", overflowY:"auto",
          }}>
            <div style={{ width:40, height:4, background:C.border, borderRadius:4, margin:"0 auto 18px" }} />
            <div style={{ fontFamily:"'Georgia',serif", fontSize:19, color:C.dark, fontStyle:"italic", marginBottom:16 }}>
              🗓 Add Your Festival
            </div>

            {/* Festival name */}
            <div style={{ fontSize:11, color:C.muted, fontWeight:600, marginBottom:5 }}>FESTIVAL / OCCASION NAME</div>
            <input value={newFest.name} onChange={e=>setNewFest(f=>({...f,name:e.target.value}))}
              placeholder="e.g. Karthigai Deepam, Chhath Puja…"
              style={{ width:"100%", border:`1.5px solid ${C.border}`, borderRadius:12, padding:"10px 14px",
                fontSize:14, outline:"none", background:C.jasmine, fontFamily:"inherit",
                boxSizing:"border-box", marginBottom:14 }} />

            {/* Date */}
            <div style={{ fontSize:11, color:C.muted, fontWeight:600, marginBottom:5 }}>DATE</div>
            <input type="date" value={newFest.fullDate} onChange={e=>setNewFest(f=>({...f,fullDate:e.target.value}))}
              style={{ width:"100%", border:`1.5px solid ${C.border}`, borderRadius:12, padding:"10px 14px",
                fontSize:14, outline:"none", background:C.jasmine, fontFamily:"inherit",
                boxSizing:"border-box", marginBottom:14 }} />

            {/* Note */}
            <div style={{ fontSize:11, color:C.muted, fontWeight:600, marginBottom:5 }}>NOTE (optional)</div>
            <input value={newFest.note} onChange={e=>setNewFest(f=>({...f,note:e.target.value}))}
              placeholder="e.g. Regional festival, family tradition…"
              style={{ width:"100%", border:`1.5px solid ${C.border}`, borderRadius:12, padding:"10px 14px",
                fontSize:13, outline:"none", background:C.jasmine, fontFamily:"inherit",
                boxSizing:"border-box", marginBottom:14 }} />

            {/* Icon picker */}
            <div style={{ fontSize:11, color:C.muted, fontWeight:600, marginBottom:8 }}>PICK AN ICON</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:14 }}>
              {iconOptions.map(ic=>(
                <div key={ic} onClick={()=>setNewFest(f=>({...f,icon:ic}))} style={{
                  width:36, height:36, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:20, cursor:"pointer",
                  border:`2px solid ${newFest.icon===ic?C.kumkum:C.border}`,
                  background: newFest.icon===ic?C.kumkum+"15":C.sandal,
                }}>{ic}</div>
              ))}
            </div>

            {/* Color picker */}
            <div style={{ fontSize:11, color:C.muted, fontWeight:600, marginBottom:8 }}>PICK A COLOUR</div>
            <div style={{ display:"flex", gap:10, marginBottom:22 }}>
              {colorOptions.map(col=>(
                <div key={col} onClick={()=>setNewFest(f=>({...f,color:col}))} style={{
                  width:28, height:28, borderRadius:"50%", background:col, cursor:"pointer",
                  border:`3px solid ${newFest.color===col?"#fff":"transparent"}`,
                  boxShadow: newFest.color===col?`0 0 0 2px ${col}`:"none",
                  transition:"all 0.15s",
                }} />
              ))}
            </div>

            <div style={{ display:"flex", gap:10 }}>
              <button onClick={()=>setAddModal(false)} style={{
                flex:1, background:C.sandal, border:`1.5px solid ${C.border}`, borderRadius:12,
                padding:"12px", cursor:"pointer", fontSize:14, color:C.muted, fontWeight:600,
              }}>Cancel</button>
              <button onClick={addCustomFestival} disabled={!newFest.name.trim()||!newFest.fullDate} style={{
                flex:2, background: (!newFest.name.trim()||!newFest.fullDate)?C.muted:C.kumkum,
                border:"none", borderRadius:12, padding:"12px",
                cursor: (!newFest.name.trim()||!newFest.fullDate)?"not-allowed":"pointer",
                fontSize:14, color:"#fff", fontWeight:700,
              }}>Save Festival 🎉</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Budget ─────────────────────────────────────────────────────────────────
const DEFAULT_CATS = [
  { id:"groceries", name:"Groceries & Vegetables", icon:"🛒", color:C.peacock  },
  { id:"education", name:"School & Tuition",        icon:"📚", color:C.indigo   },
  { id:"bills",     name:"Electricity & Bills",     icon:"💡", color:C.turmeric },
  { id:"medical",   name:"Medical & Pharmacy",      icon:"💊", color:C.kumkum   },
  { id:"household", name:"Household Items",         icon:"🏠", color:C.clay     },
  { id:"clothing",  name:"Clothing & Personal",     icon:"👗", color:C.saffron  },
  { id:"other",     name:"Other",                   icon:"📦", color:C.muted    },
];

function BudgetScreen({ salary, setSalary, expenses, setExpenses }) {
  const monthName = new Date().toLocaleDateString("en-IN",{month:"long",year:"numeric"});

  // Salary setup
  const [salaryInput, setSalaryInput] = useState(salary ? String(salary) : "");
  const [editSalary, setEditSalary]   = useState(false);

  // Expenses local UI state
  const [newDesc, setNewDesc]   = useState("");
  const [newAmt, setNewAmt]     = useState("");
  const [newCat, setNewCat]     = useState("groceries");

  // Computed
  const totalSpent = expenses.reduce((s,e)=>s+e.amt, 0);
  const remaining  = salary ? salary - totalSpent : null;
  const pct        = salary ? Math.min(Math.round((totalSpent/salary)*100),100) : 0;

  const spentByCat = (catId) => expenses.filter(e=>e.cat===catId).reduce((s,e)=>s+e.amt,0);

  const addExpense = () => {
    if (!newDesc.trim() || !newAmt || isNaN(Number(newAmt))) return;
    setExpenses(e => [{
      id: Date.now(),
      desc: newDesc.trim(),
      amt: Number(newAmt),
      cat: newCat,
      date: "Just now",
    }, ...e]);
    setNewDesc(""); setNewAmt("");
  };

  const removeExpense = (id) => setExpenses(e => e.filter(x=>x.id!==id));

  const saveSalary = () => {
    const v = Number(salaryInput);
    if (v > 0) { setSalary(v); setEditSalary(false); }
  };

  const catFor = (catId) => DEFAULT_CATS.find(c=>c.id===catId) || DEFAULT_CATS[DEFAULT_CATS.length-1];

  // ── Not set up yet ──
  if (salary === null || editSalary) {
    return (
      <div style={{ padding:"40px 24px 100px", display:"flex", flexDirection:"column", alignItems:"center" }}>
        <div style={{ fontSize:48, marginBottom:16 }}>💰</div>
        <div style={{ fontFamily:"'Georgia',serif", fontSize:22, color:C.dark, fontStyle:"italic", textAlign:"center", marginBottom:8 }}>
          Set Up Your Budget
        </div>
        <div style={{ fontSize:14, color:C.muted, textAlign:"center", marginBottom:30, lineHeight:1.6 }}>
          Enter your monthly household budget or salary to start tracking your expenses.
        </div>
        <div style={{ width:"100%", maxWidth:340 }}>
          <div style={{ fontSize:11, color:C.muted, fontWeight:600, marginBottom:8, letterSpacing:"0.05em" }}>
            MONTHLY BUDGET / SALARY (₹)
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <div style={{ position:"relative", flex:1 }}>
              <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)",
                fontSize:16, color:C.muted, fontWeight:700 }}>₹</span>
              <input
                autoFocus
                type="number"
                value={salaryInput}
                onChange={e=>setSalaryInput(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&saveSalary()}
                placeholder="e.g. 45000"
                style={{
                  width:"100%", border:`2px solid ${C.peacock}`, borderRadius:14,
                  padding:"13px 14px 13px 32px", fontSize:18, outline:"none",
                  background:C.jasmine, fontFamily:"inherit", boxSizing:"border-box",
                  fontWeight:700, color:C.dark,
                }}
              />
            </div>
            <button onClick={saveSalary} style={{
              background:C.peacock, color:"#fff", border:"none", borderRadius:14,
              padding:"13px 22px", cursor:"pointer", fontWeight:700, fontSize:15,
            }}>Set</button>
          </div>
          {editSalary && (
            <button onClick={()=>setEditSalary(false)} style={{
              marginTop:14, width:"100%", background:"none", border:`1.5px solid ${C.border}`,
              borderRadius:12, padding:"10px", cursor:"pointer", color:C.muted, fontSize:13,
            }}>Cancel</button>
          )}
          <div style={{ marginTop:16, display:"flex", flexWrap:"wrap", gap:8 }}>
            {[20000,30000,40000,50000,60000,75000].map(v=>(
              <button key={v} onClick={()=>setSalaryInput(String(v))} style={{
                padding:"6px 14px", borderRadius:20, border:`1.5px solid ${C.border}`,
                background: salaryInput==String(v)?C.peacock+"20":C.sandal,
                color: salaryInput==String(v)?C.peacock:C.dark,
                fontSize:12, cursor:"pointer", fontWeight:600,
              }}>₹{(v/1000)}k</button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Main budget view ──
  return (
    <div style={{ padding:"20px 18px 100px" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <RangoliDot color={C.peacock} />
          <span style={{ fontFamily:"'Georgia',serif", fontSize:20, color:C.dark, fontStyle:"italic" }}>Ghar ka Budget</span>
        </div>
        <button onClick={()=>{ setSalaryInput(String(salary)); setEditSalary(true); }} style={{
          fontSize:11, fontWeight:700, padding:"6px 12px", borderRadius:10, cursor:"pointer",
          background:C.sandal, color:C.dark, border:`1.5px solid ${C.border}`,
        }}>✏️ Edit Budget</button>
      </div>

      {/* Monthly overview banner */}
      <div style={{
        background:`linear-gradient(135deg, ${C.peacock}, #0F4D3A)`,
        borderRadius:20, padding:"18px 20px", marginBottom:16, color:"#fff",
      }}>
        <div style={{ fontSize:12, opacity:0.8, marginBottom:2 }}>{monthName}</div>
        <div style={{ fontSize:13, opacity:0.75, marginBottom:4 }}>Monthly Budget</div>
        <div style={{ fontSize:30, fontWeight:700, fontFamily:"'Georgia',serif" }}>
          ₹{salary.toLocaleString("en-IN")}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginTop:14, marginBottom:10 }}>
          <div style={{ background:"rgba(255,255,255,0.12)", borderRadius:12, padding:"10px 12px" }}>
            <div style={{ fontSize:11, opacity:0.75 }}>Spent so far</div>
            <div style={{ fontSize:18, fontWeight:700, marginTop:2 }}>₹{totalSpent.toLocaleString("en-IN")}</div>
          </div>
          <div style={{ background:"rgba(255,255,255,0.12)", borderRadius:12, padding:"10px 12px" }}>
            <div style={{ fontSize:11, opacity:0.75 }}>Remaining</div>
            <div style={{ fontSize:18, fontWeight:700, marginTop:2, color: remaining<0?C.marigold:"#fff" }}>
              {remaining < 0 ? "-" : ""}₹{Math.abs(remaining).toLocaleString("en-IN")}
            </div>
          </div>
        </div>
        <div style={{ background:"rgba(255,255,255,0.25)", borderRadius:10, height:8 }}>
          <div style={{ borderRadius:10, height:8, transition:"width 0.4s",
            background: pct>90?C.kumkum:pct>70?C.marigold:"rgba(255,255,255,0.85)",
            width:`${pct}%` }} />
        </div>
        <div style={{ fontSize:11, opacity:0.8, marginTop:5 }}>{pct}% of budget used</div>
      </div>

      {/* Category breakdown — only show cats with spending */}
      {expenses.length > 0 && (
        <>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
            <RangoliDot color={C.peacock} />
            <span style={{ fontFamily:"'Georgia',serif", fontSize:16, color:C.dark, fontStyle:"italic" }}>Spending by Category</span>
          </div>
          <div style={{ background:C.card, borderRadius:16, border:`1.5px solid ${C.border}`, marginBottom:16, overflow:"hidden" }}>
            {DEFAULT_CATS.map((cat,i)=>{
              const spent = spentByCat(cat.id);
              if (spent === 0) return null;
              const p = salary ? Math.min(Math.round((spent/salary)*100),100) : 0;
              return (
                <div key={cat.id} style={{ padding:"11px 14px", borderBottom: i<DEFAULT_CATS.length-1?`1px solid ${C.border}`:"none" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                    <span style={{ fontSize:13, color:C.dark }}>{cat.icon} {cat.name}</span>
                    <span style={{ fontSize:12, fontWeight:700, color:cat.color }}>
                      ₹{spent.toLocaleString("en-IN")}
                      {salary && <span style={{ fontSize:10, color:C.muted, fontWeight:400 }}> ({p}%)</span>}
                    </span>
                  </div>
                  <div style={{ background:C.sandal, borderRadius:6, height:4 }}>
                    <div style={{ background:cat.color, borderRadius:6, height:4, width:`${p}%`, transition:"width 0.4s" }} />
                  </div>
                </div>
              );
            }).filter(Boolean)}
          </div>
        </>
      )}

      {/* Add expense */}
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
        <RangoliDot color={C.saffron} />
        <span style={{ fontFamily:"'Georgia',serif", fontSize:16, color:C.dark, fontStyle:"italic" }}>Add Expense</span>
      </div>

      {/* Category selector */}
      <div style={{ display:"flex", gap:6, overflowX:"auto", paddingBottom:6, marginBottom:10 }}>
        {DEFAULT_CATS.map(cat=>(
          <button key={cat.id} onClick={()=>setNewCat(cat.id)} style={{
            flexShrink:0, padding:"6px 12px", borderRadius:20, border:"none", cursor:"pointer", fontSize:12,
            background: newCat===cat.id ? cat.color : C.sandal,
            color: newCat===cat.id ? "#fff" : C.dark,
            fontWeight: newCat===cat.id ? 700 : 400, transition:"all 0.2s",
          }}>{cat.icon} {cat.name.split(" ")[0]}</button>
        ))}
      </div>

      <div style={{ display:"flex", gap:8, marginBottom:16 }}>
        <input value={newDesc} onChange={e=>setNewDesc(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&addExpense()}
          placeholder="What did you spend on?"
          style={{ flex:2, border:`1.5px solid ${C.border}`, borderRadius:12, padding:"10px 12px",
            fontSize:13, outline:"none", background:C.jasmine, fontFamily:"inherit" }} />
        <div style={{ position:"relative", flex:1 }}>
          <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", fontSize:13, color:C.muted }}>₹</span>
          <input value={newAmt} onChange={e=>setNewAmt(e.target.value)} type="number"
            onKeyDown={e=>e.key==="Enter"&&addExpense()}
            placeholder="Amount"
            style={{ width:"100%", border:`1.5px solid ${C.border}`, borderRadius:12, padding:"10px 10px 10px 24px",
              fontSize:13, outline:"none", background:C.jasmine, fontFamily:"inherit", boxSizing:"border-box" }} />
        </div>
        <button onClick={addExpense} style={{
          background:C.saffron, color:"#fff", border:"none", borderRadius:12,
          padding:"10px 14px", cursor:"pointer", fontWeight:700, fontSize:16,
        }}>+</button>
      </div>

      {/* Expense list */}
      {expenses.length === 0 ? (
        <div style={{ background:C.card, borderRadius:16, border:`1.5px dashed ${C.border}`, padding:"24px", textAlign:"center", marginBottom:20 }}>
          <div style={{ fontSize:32, marginBottom:8 }}>📋</div>
          <div style={{ fontSize:13, color:C.muted, fontStyle:"italic" }}>No expenses added yet. Start tracking above!</div>
        </div>
      ) : (
        <div style={{ background:C.card, borderRadius:16, border:`1.5px solid ${C.border}`, marginBottom:20, overflow:"hidden" }}>
          {expenses.map((e,i)=>{
            const cat = catFor(e.cat);
            return (
              <div key={e.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 14px",
                borderBottom: i<expenses.length-1?`1px solid ${C.border}`:"none" }}>
                <div style={{ width:32, height:32, borderRadius:10, background:cat.color+"20",
                  display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>
                  {cat.icon}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, color:C.dark, fontWeight:500 }}>{e.desc}</div>
                  <div style={{ display:"flex", gap:6, marginTop:2, alignItems:"center" }}>
                    <span style={{ fontSize:10, color:cat.color, fontWeight:700 }}>{cat.name.split(" ")[0]}</span>
                    <span style={{ fontSize:10, color:C.muted }}>{e.date}</span>
                  </div>
                </div>
                <div style={{ fontSize:14, fontWeight:700, color:C.kumkum, flexShrink:0 }}>
                  −₹{e.amt.toLocaleString("en-IN")}
                </div>
                <button onClick={()=>removeExpense(e.id)} style={{
                  background:"none", border:"none", color:C.muted, cursor:"pointer", fontSize:16, flexShrink:0,
                }}>×</button>
              </div>
            );
          })}
        </div>
      )}

      <AiChat
        system={`You are a household budget advisor for Indian families. Help with budgeting tips, saving money on groceries, tracking household expenses, planning for festivals, managing EMIs, and financial planning for middle-class Indian families. Be practical, culturally aware, and give specific advice in Indian Rupees. The user's monthly budget is ₹${salary?.toLocaleString("en-IN")} and they have spent ₹${totalSpent.toLocaleString("en-IN")} so far.`}
        placeholder="Ask about saving on vegetables, festival budget planning, how to reduce electricity bill…"
        accent={C.peacock}
      />
    </div>
  );
}

// ── Kids ──────────────────────────────────────────────────────────────────
const KID_AVATARS = ["👦","👧","🧒","👶","🧑"];
const KID_COLORS  = [C.indigo, C.kumkum, C.peacock, C.turmeric, C.saffron];

const BLANK_KID = () => ({
  id: Date.now(),
  name:"", age:"", gender:"👦", class:"", school:"", board:"CBSE",
  tuition:"", notes:"",
  subjects:[], homeworks:[],
});
const BLANK_SUBJECT = () => ({ id:Date.now(), sub:"", marks:"", teacher:"", exam:"" });
const BLANK_HW      = () => ({ id:Date.now(), text:"", due:"", done:false });

function KidsScreen() {
  const [kids,       setKids]       = useState([]);
  const [activeIdx,  setActiveIdx]  = useState(0);
  const [modal,      setModal]      = useState(null); // "add-kid" | "edit-kid" | "add-subject" | "edit-kid-idx"
  const [draft,      setDraft]      = useState(null); // kid being edited/added
  const [subDraft,   setSubDraft]   = useState(null);
  const [hwText,     setHwText]     = useState("");
  const [hwDue,      setHwDue]      = useState("");
  const [editSubIdx, setEditSubIdx] = useState(null);

  const kid = kids[activeIdx] || null;
  const gradeColor = (m) => { const n=Number(m); return n>=90?C.peacock:n>=75?C.turmeric:C.kumkum; };

  /* ── Kid CRUD ── */
  const openAddKid = () => { setDraft(BLANK_KID()); setModal("add-kid"); };
  const openEditKid = (i) => { setDraft({...kids[i], subjects:[...kids[i].subjects], homeworks:[...kids[i].homeworks]}); setModal("edit-kid"); };

  const saveKid = () => {
    if (!draft.name.trim()) return;
    if (modal === "add-kid") {
      setKids(ks => { const updated=[...ks, draft]; setActiveIdx(updated.length-1); return updated; });
    } else {
      setKids(ks => ks.map(k=>k.id===draft.id?draft:k));
    }
    setModal(null); setDraft(null);
  };

  const deleteKid = (id) => {
    setKids(ks=>{ const updated=ks.filter(k=>k.id!==id); setActiveIdx(Math.max(0,activeIdx-1)); return updated; });
    setModal(null);
  };

  /* ── Subject CRUD ── */
  const openAddSubject = () => { setSubDraft(BLANK_SUBJECT()); setEditSubIdx(null); setModal("add-subject"); };
  const openEditSubject = (i) => { setSubDraft({...kid.subjects[i]}); setEditSubIdx(i); setModal("add-subject"); };

  const saveSubject = () => {
    if (!subDraft.sub.trim()) return;
    setKids(ks => ks.map(k => k.id!==kid.id ? k : {
      ...k, subjects: editSubIdx===null
        ? [...k.subjects, subDraft]
        : k.subjects.map((s,i)=>i===editSubIdx?subDraft:s)
    }));
    setModal(null); setSubDraft(null); setEditSubIdx(null);
  };

  const deleteSubject = (i) => {
    setKids(ks=>ks.map(k=>k.id!==kid.id?k:{...k,subjects:k.subjects.filter((_,si)=>si!==i)}));
  };

  /* ── Homework ── */
  const addHw = () => {
    if (!hwText.trim()) return;
    const hw = { ...BLANK_HW(), text:hwText.trim(), due:hwDue||"Soon" };
    setKids(ks=>ks.map(k=>k.id!==kid.id?k:{...k,homeworks:[...k.homeworks,hw]}));
    setHwText(""); setHwDue("");
  };
  const toggleHw = (hwId) => setKids(ks=>ks.map(k=>k.id!==kid.id?k:{...k,homeworks:k.homeworks.map(h=>h.id===hwId?{...h,done:!h.done}:h)}));
  const deleteHw = (hwId) => setKids(ks=>ks.map(k=>k.id!==kid.id?k:{...k,homeworks:k.homeworks.filter(h=>h.id!==hwId)}));

  /* ── EMPTY STATE ── */
  if (kids.length === 0) return (
    <div style={{ padding:"50px 24px 100px", display:"flex", flexDirection:"column", alignItems:"center" }}>
      <div style={{ fontSize:56, marginBottom:16 }}>👨‍👩‍👧‍👦</div>
      <div style={{ fontFamily:"'Georgia',serif", fontSize:22, color:C.dark, fontStyle:"italic", textAlign:"center", marginBottom:10 }}>
        Add Your Children
      </div>
      <div style={{ fontSize:14, color:C.muted, textAlign:"center", lineHeight:1.7, marginBottom:32, maxWidth:300 }}>
        Track each child's school details, subjects, marks, tuition, and homework — all in one place.
      </div>
      <button onClick={openAddKid} style={{
        background:`linear-gradient(135deg,${C.indigo},#1a2a5e)`, color:"#fff",
        border:"none", borderRadius:16, padding:"14px 32px",
        fontSize:15, fontWeight:700, cursor:"pointer",
        boxShadow:"0 4px 16px rgba(44,62,122,0.3)",
      }}>+ Add First Child</button>

      {/* Add kid modal */}
      {modal==="add-kid" && draft && <KidFormModal draft={draft} setDraft={setDraft} onSave={saveKid} onClose={()=>setModal(null)} isEdit={false} />}
    </div>
  );

  /* ── MAIN VIEW ── */
  return (
    <div style={{ padding:"20px 18px 100px" }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <RangoliDot color={C.indigo} />
          <span style={{ fontFamily:"'Georgia',serif", fontSize:20, color:C.dark, fontStyle:"italic" }}>Kids' Tracker</span>
        </div>
        <button onClick={openAddKid} style={{
          fontSize:11, fontWeight:700, padding:"7px 14px", borderRadius:10,
          background:C.indigo, color:"#fff", border:"none", cursor:"pointer",
        }}>+ Add Child</button>
      </div>

      {/* Kid selector tabs */}
      <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:8, marginBottom:18 }}>
        {kids.map((k,i)=>(
          <div key={k.id} onClick={()=>setActiveIdx(i)} style={{
            flexShrink:0, minWidth:80, borderRadius:14, padding:"10px 12px",
            border:`2px solid ${activeIdx===i?KID_COLORS[i%5]:C.border}`,
            background: activeIdx===i ? KID_COLORS[i%5]+"18" : C.card,
            cursor:"pointer", transition:"all 0.2s", textAlign:"center",
          }}>
            <div style={{ fontSize:24, marginBottom:3 }}>{k.gender||"👦"}</div>
            <div style={{ fontSize:12, fontWeight:700, color:activeIdx===i?KID_COLORS[i%5]:C.dark }}>{k.name}</div>
            <div style={{ fontSize:10, color:C.muted }}>{k.class ? `Class ${k.class}` : k.age ? `Age ${k.age}` : "—"}</div>
          </div>
        ))}
      </div>

      {kid && <>
        {/* Profile card */}
        <div style={{
          background:`linear-gradient(135deg,${KID_COLORS[activeIdx%5]}18,${KID_COLORS[activeIdx%5]}05)`,
          borderRadius:18, border:`2px solid ${KID_COLORS[activeIdx%5]}30`, padding:"14px 16px", marginBottom:14,
        }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div style={{ display:"flex", gap:12, alignItems:"center" }}>
              <div style={{
                width:52, height:52, borderRadius:"50%", fontSize:28,
                background:KID_COLORS[activeIdx%5]+"22", display:"flex", alignItems:"center", justifyContent:"center",
                border:`2px solid ${KID_COLORS[activeIdx%5]}40`,
              }}>{kid.gender||"👦"}</div>
              <div>
                <div style={{ fontSize:18, fontWeight:700, color:C.dark }}>{kid.name}</div>
                <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>
                  {[kid.age&&`Age ${kid.age}`, kid.class&&`Class ${kid.class}`, kid.board].filter(Boolean).join(" · ")}
                </div>
              </div>
            </div>
            <button onClick={()=>openEditKid(activeIdx)} style={{
              fontSize:11, padding:"6px 12px", borderRadius:10, cursor:"pointer",
              background:C.sandal, border:`1.5px solid ${C.border}`, color:C.dark, fontWeight:600,
            }}>✏️ Edit</button>
          </div>

          {/* Info chips */}
          <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginTop:12 }}>
            {kid.school && <Chip label={`🏫 ${kid.school}`} />}
            {kid.tuition && <Chip label={`📖 ${kid.tuition}`} />}
            {kid.notes   && <Chip label={`📝 ${kid.notes}`} color={C.turmeric} />}
          </div>
        </div>

        {/* Subjects */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <RangoliDot color={KID_COLORS[activeIdx%5]} />
            <span style={{ fontFamily:"'Georgia',serif", fontSize:16, color:C.dark, fontStyle:"italic" }}>Subjects & Marks</span>
          </div>
          <button onClick={openAddSubject} style={{
            fontSize:11, fontWeight:700, padding:"5px 12px", borderRadius:8, cursor:"pointer",
            background:KID_COLORS[activeIdx%5]+"18", color:KID_COLORS[activeIdx%5],
            border:`1.5px solid ${KID_COLORS[activeIdx%5]}40`,
          }}>+ Subject</button>
        </div>

        {kid.subjects.length===0 ? (
          <div style={{ background:C.card, borderRadius:14, border:`1.5px dashed ${C.border}`, padding:"18px", textAlign:"center", marginBottom:14 }}>
            <div style={{ fontSize:13, color:C.muted, fontStyle:"italic" }}>No subjects added yet. Tap "+ Subject" to add.</div>
          </div>
        ) : (
          <div style={{ background:C.card, borderRadius:14, border:`1.5px solid ${C.border}`, marginBottom:14, overflow:"hidden" }}>
            {kid.subjects.map((s,i)=>(
              <div key={s.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 14px",
                borderBottom:i<kid.subjects.length-1?`1px solid ${C.border}`:"none" }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:14, fontWeight:600, color:C.dark }}>{s.sub}</div>
                  <div style={{ fontSize:11, color:C.muted, marginTop:1 }}>
                    {[s.teacher&&`${s.teacher}`, s.exam&&`Exam: ${s.exam}`].filter(Boolean).join(" · ")}
                  </div>
                </div>
                {s.marks!==undefined && s.marks!=="" && (
                  <div style={{
                    width:40, height:40, borderRadius:"50%", flexShrink:0,
                    background:gradeColor(s.marks)+"20", border:`2px solid ${gradeColor(s.marks)}`,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontWeight:700, fontSize:13, color:gradeColor(s.marks),
                  }}>{s.marks}</div>
                )}
                <button onClick={()=>openEditSubject(i)} style={{ background:"none", border:"none", color:C.muted, cursor:"pointer", fontSize:14, padding:"0 2px" }}>✏️</button>
                <button onClick={()=>deleteSubject(i)} style={{ background:"none", border:"none", color:C.muted, cursor:"pointer", fontSize:14, padding:"0 2px" }}>×</button>
              </div>
            ))}
          </div>
        )}

        {/* Homework */}
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
          <RangoliDot color={C.kumkum} />
          <span style={{ fontFamily:"'Georgia',serif", fontSize:16, color:C.dark, fontStyle:"italic" }}>Homework Tracker</span>
        </div>

        {/* Add HW row */}
        <div style={{ display:"flex", gap:6, marginBottom:10 }}>
          <input value={hwText} onChange={e=>setHwText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addHw()}
            placeholder="Homework description…"
            style={{ flex:2, border:`1.5px solid ${C.border}`, borderRadius:10, padding:"9px 12px",
              fontSize:13, outline:"none", background:C.jasmine, fontFamily:"inherit" }} />
          <input value={hwDue} onChange={e=>setHwDue(e.target.value)} placeholder="Due (e.g. Friday)"
            style={{ flex:1, border:`1.5px solid ${C.border}`, borderRadius:10, padding:"9px 10px",
              fontSize:12, outline:"none", background:C.jasmine, fontFamily:"inherit" }} />
          <button onClick={addHw} style={{
            background:C.kumkum, color:"#fff", border:"none", borderRadius:10,
            padding:"9px 14px", cursor:"pointer", fontWeight:700, fontSize:15,
          }}>+</button>
        </div>

        {kid.homeworks.length===0 ? (
          <div style={{ background:C.card, borderRadius:14, border:`1.5px dashed ${C.border}`, padding:"16px", textAlign:"center", marginBottom:18 }}>
            <div style={{ fontSize:13, color:C.muted, fontStyle:"italic" }}>No homework yet — all clear! 🎉</div>
          </div>
        ) : (
          <div style={{ background:C.card, borderRadius:14, border:`1.5px solid ${C.border}`, marginBottom:18, overflow:"hidden" }}>
            {kid.homeworks.map((hw,i)=>(
              <div key={hw.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px",
                borderBottom:i<kid.homeworks.length-1?`1px solid ${C.border}`:"none", opacity:hw.done?0.5:1 }}>
                <div onClick={()=>toggleHw(hw.id)} style={{
                  width:20, height:20, borderRadius:6, flexShrink:0, cursor:"pointer",
                  border:`2px solid ${hw.done?C.peacock:C.border}`, background:hw.done?C.peacock:"transparent",
                  display:"flex", alignItems:"center", justifyContent:"center",
                }}>
                  {hw.done && <span style={{ color:"#fff", fontSize:10 }}>✓</span>}
                </div>
                <div onClick={()=>toggleHw(hw.id)} style={{ flex:1, cursor:"pointer" }}>
                  <div style={{ fontSize:13, color:C.dark, textDecoration:hw.done?"line-through":"none" }}>{hw.text}</div>
                  {hw.due && <div style={{ fontSize:11, color:C.kumkum, marginTop:1 }}>Due: {hw.due}</div>}
                </div>
                <button onClick={()=>deleteHw(hw.id)} style={{ background:"none", border:"none", color:C.muted, cursor:"pointer", fontSize:15 }}>×</button>
              </div>
            ))}
          </div>
        )}

        <AiChat
          system={`You are a helpful education assistant for Indian parents. Help with homework explanations, study schedules, exam preparation tips, CBSE/ICSE/State Board curriculum guidance, dealing with exam stress, extracurricular advice, and tips to support children's learning at home. Current child: ${kid.name}${kid.class?`, Class ${kid.class}`:""}${kid.school?`, ${kid.school}`:""}${kid.board?`, ${kid.board}`:""}.`}
          placeholder={`Ask for study tips for ${kid.name}, explain a concept, revision schedule…`}
          accent={KID_COLORS[activeIdx%5]}
        />
      </>}

      {/* ── Modals ── */}
      {(modal==="add-kid"||modal==="edit-kid") && draft && (
        <KidFormModal
          draft={draft} setDraft={setDraft}
          onSave={saveKid}
          onClose={()=>{setModal(null);setDraft(null);}}
          onDelete={modal==="edit-kid"?()=>deleteKid(draft.id):null}
          isEdit={modal==="edit-kid"}
        />
      )}

      {modal==="add-subject" && subDraft && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:200,
          display:"flex", alignItems:"flex-end", justifyContent:"center" }}
          onClick={()=>setModal(null)}>
          <div onClick={e=>e.stopPropagation()} style={{
            background:C.card, borderRadius:"20px 20px 0 0",
            padding:"22px 20px 36px", width:"100%", maxWidth:480,
            boxShadow:"0 -8px 30px rgba(0,0,0,0.2)",
          }}>
            <div style={{ width:40, height:4, background:C.border, borderRadius:4, margin:"0 auto 18px" }} />
            <div style={{ fontFamily:"'Georgia',serif", fontSize:18, color:C.dark, fontStyle:"italic", marginBottom:16 }}>
              {editSubIdx===null?"Add Subject":"Edit Subject"}
            </div>
            {[
              ["SUBJECT NAME *", "sub", "e.g. Maths, Science, Hindi…"],
              ["TEACHER", "teacher", "e.g. Mrs. Sharma"],
              ["RECENT MARKS / GRADE", "marks", "e.g. 88, A+"],
              ["NEXT EXAM DATE", "exam", "e.g. Apr 15"],
            ].map(([label,key,ph])=>(
              <div key={key} style={{ marginBottom:12 }}>
                <div style={{ fontSize:10, color:C.muted, fontWeight:700, marginBottom:5, letterSpacing:"0.05em" }}>{label}</div>
                <input value={subDraft[key]||""} onChange={e=>setSubDraft(s=>({...s,[key]:e.target.value}))}
                  placeholder={ph}
                  style={{ width:"100%", border:`1.5px solid ${C.border}`, borderRadius:11, padding:"9px 13px",
                    fontSize:13, outline:"none", background:C.jasmine, fontFamily:"inherit", boxSizing:"border-box" }} />
              </div>
            ))}
            <div style={{ display:"flex", gap:10, marginTop:6 }}>
              <button onClick={()=>setModal(null)} style={{ flex:1, background:C.sandal, border:`1.5px solid ${C.border}`,
                borderRadius:12, padding:"11px", cursor:"pointer", fontSize:13, color:C.muted, fontWeight:600 }}>Cancel</button>
              <button onClick={saveSubject} style={{ flex:2, background:C.indigo, border:"none",
                borderRadius:12, padding:"11px", cursor:"pointer", fontSize:13, color:"#fff", fontWeight:700 }}>Save ✓</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* small helper chip */
function Chip({ label, color=C.indigo }) {
  return (
    <span style={{ fontSize:11, padding:"4px 10px", borderRadius:20,
      background:color+"15", color:color, border:`1px solid ${color}30`, fontWeight:500 }}>
      {label}
    </span>
  );
}

/* Kid add / edit form modal */
function KidFormModal({ draft, setDraft, onSave, onClose, onDelete, isEdit }) {
  const genderOptions = ["👦","👧","🧒","👶","🧑"];
  const boardOptions  = ["CBSE","ICSE","State Board","IB","IGCSE","Other"];
  const set = (key,val) => setDraft(d=>({...d,[key]:val}));

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:200,
      display:"flex", alignItems:"flex-end", justifyContent:"center" }}
      onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:C.card, borderRadius:"20px 20px 0 0",
        padding:"22px 20px 40px", width:"100%", maxWidth:480,
        boxShadow:"0 -8px 30px rgba(0,0,0,0.2)",
        maxHeight:"90vh", overflowY:"auto",
      }}>
        <div style={{ width:40, height:4, background:C.border, borderRadius:4, margin:"0 auto 18px" }} />
        <div style={{ fontFamily:"'Georgia',serif", fontSize:19, color:C.dark, fontStyle:"italic", marginBottom:18 }}>
          {isEdit ? "Edit Child's Details" : "Add a Child 🌟"}
        </div>

        {/* Avatar / gender */}
        <div style={{ fontSize:10, color:C.muted, fontWeight:700, marginBottom:8, letterSpacing:"0.05em" }}>AVATAR</div>
        <div style={{ display:"flex", gap:10, marginBottom:16 }}>
          {genderOptions.map(g=>(
            <div key={g} onClick={()=>set("gender",g)} style={{
              width:42, height:42, borderRadius:12, fontSize:24, cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center",
              border:`2px solid ${draft.gender===g?C.indigo:C.border}`,
              background: draft.gender===g?C.indigo+"18":C.sandal,
              transition:"all 0.15s",
            }}>{g}</div>
          ))}
        </div>

        {/* Name */}
        <Field label="CHILD'S NAME *" value={draft.name} onChange={v=>set("name",v)} placeholder="e.g. Aarav, Priya…" />

        {/* Age + Class side by side */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
          <div>
            <div style={{ fontSize:10, color:C.muted, fontWeight:700, marginBottom:5, letterSpacing:"0.05em" }}>AGE</div>
            <input value={draft.age} onChange={e=>set("age",e.target.value)} type="number" placeholder="e.g. 10"
              style={{ width:"100%", border:`1.5px solid ${C.border}`, borderRadius:11, padding:"9px 12px",
                fontSize:13, outline:"none", background:C.jasmine, fontFamily:"inherit", boxSizing:"border-box" }} />
          </div>
          <div>
            <div style={{ fontSize:10, color:C.muted, fontWeight:700, marginBottom:5, letterSpacing:"0.05em" }}>CLASS / GRADE</div>
            <input value={draft.class} onChange={e=>set("class",e.target.value)} placeholder="e.g. 5th, LKG…"
              style={{ width:"100%", border:`1.5px solid ${C.border}`, borderRadius:11, padding:"9px 12px",
                fontSize:13, outline:"none", background:C.jasmine, fontFamily:"inherit", boxSizing:"border-box" }} />
          </div>
        </div>

        <Field label="SCHOOL NAME" value={draft.school} onChange={v=>set("school",v)} placeholder="e.g. DPS, Kendriya Vidyalaya…" />

        {/* Board */}
        <div style={{ fontSize:10, color:C.muted, fontWeight:700, marginBottom:8, letterSpacing:"0.05em" }}>BOARD</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:7, marginBottom:14 }}>
          {boardOptions.map(b=>(
            <button key={b} onClick={()=>set("board",b)} style={{
              padding:"6px 14px", borderRadius:20, border:"none", cursor:"pointer", fontSize:12,
              background: draft.board===b?C.indigo:C.sandal,
              color: draft.board===b?"#fff":C.dark,
              fontWeight: draft.board===b?700:400, transition:"all 0.2s",
            }}>{b}</button>
          ))}
        </div>

        <Field label="TUITION DETAILS" value={draft.tuition} onChange={v=>set("tuition",v)} placeholder="e.g. Maths – Tues/Thu 5PM" />
        <Field label="NOTES" value={draft.notes} onChange={v=>set("notes",v)} placeholder="Any extra info, allergies, special needs…" />

        <div style={{ display:"flex", gap:10, marginTop:8 }}>
          <button onClick={onClose} style={{ flex:1, background:C.sandal, border:`1.5px solid ${C.border}`,
            borderRadius:12, padding:"12px", cursor:"pointer", fontSize:13, color:C.muted, fontWeight:600 }}>Cancel</button>
          <button onClick={onSave} disabled={!draft.name.trim()} style={{
            flex:2, background:draft.name.trim()?C.indigo:C.muted, border:"none",
            borderRadius:12, padding:"12px", cursor:draft.name.trim()?"pointer":"not-allowed",
            fontSize:14, color:"#fff", fontWeight:700,
          }}>Save ✓</button>
        </div>
        {onDelete && (
          <button onClick={onDelete} style={{
            marginTop:12, width:"100%", background:"none", border:`1px solid ${C.kumkum}50`,
            borderRadius:12, padding:"10px", cursor:"pointer", color:C.kumkum, fontSize:12, fontWeight:600,
          }}>🗑 Remove {draft.name} from tracker</button>
        )}
      </div>
    </div>
  );
}

/* Reusable text field */
function Field({ label, value, onChange, placeholder, type="text" }) {
  return (
    <div style={{ marginBottom:12 }}>
      <div style={{ fontSize:10, color:C.muted, fontWeight:700, marginBottom:5, letterSpacing:"0.05em" }}>{label}</div>
      <input value={value} onChange={e=>onChange(e.target.value)} type={type} placeholder={placeholder}
        style={{ width:"100%", border:`1.5px solid ${C.border}`, borderRadius:11, padding:"9px 13px",
          fontSize:13, outline:"none", background:C.jasmine, fontFamily:"inherit", boxSizing:"border-box" }} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SETTINGS SCREEN
// ═══════════════════════════════════════════════════════════════════════════
function SettingsScreen() {
  const [provider, setProvider] = useState(_apiProvider);
  const [input,    setInput]    = useState(_apiKey);
  const [show,     setShow]     = useState(false);
  const [saved,    setSaved]    = useState(!!_apiKey);
  const [testing,  setTesting]  = useState(false);
  const [testMsg,  setTestMsg]  = useState("");

  const save = () => {
    _apiKey      = input.trim();
    _apiProvider = provider;
    setSaved(true);
    setTestMsg("");
  };

  const test = async () => {
    if (!input.trim()) return;
    // temporarily set so askClaude uses the current input
    const prevKey = _apiKey; const prevProv = _apiProvider;
    _apiKey = input.trim(); _apiProvider = provider;
    setTesting(true); setTestMsg("");
    const result = await askClaude("You are a helpful assistant.", "Reply with exactly: API key working!", []);
    _apiKey = prevKey; _apiProvider = prevProv;
    setTesting(false);
    setTestMsg(result.toLowerCase().includes("working") ? "✅ API key is working!" : `⚠️ ${result}`);
  };

  const providerInfo = {
    groq: {
      name: "Groq (Free ⭐ Recommended)",
      color: "#F55036",
      placeholder: "gsk_...",
      url: "console.groq.com",
      steps: ["Go to console.groq.com", "Sign up for free — no credit card needed", "Click 'API Keys' → 'Create API Key'", "Copy and paste it here"],
      note: "Groq is completely free and very fast. Powered by Llama 3 (70B).",
    },
    claude: {
      name: "Anthropic Claude",
      color: C.indigo,
      placeholder: "sk-ant-api03-...",
      url: "console.anthropic.com",
      steps: ["Go to console.anthropic.com", "Sign up and add billing", "Click 'API Keys' → 'Create Key'", "Copy and paste it here"],
      note: "Claude is more powerful but requires a paid account.",
    },
  };

  const info = providerInfo[provider];

  return (
    <div style={{ padding:"24px 20px 100px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
        <RangoliDot color={C.indigo} />
        <span style={{ fontFamily:"'Georgia',serif", fontSize:20, color:C.dark, fontStyle:"italic" }}>Settings</span>
      </div>
      <p style={{ fontSize:13, color:C.muted, marginBottom:20, lineHeight:1.6 }}>
        Set up your AI assistant to power all features in the app. Groq is free and recommended!
      </p>

      {/* Provider selector */}
      <div style={{ fontSize:10, color:C.muted, fontWeight:700, marginBottom:8, letterSpacing:"0.05em" }}>CHOOSE YOUR AI PROVIDER</div>
      <div style={{ display:"flex", gap:10, marginBottom:20 }}>
        {Object.entries(providerInfo).map(([key, val])=>(
          <div key={key} onClick={()=>{ setProvider(key); setSaved(false); setTestMsg(""); }} style={{
            flex:1, borderRadius:14, padding:"12px 10px", cursor:"pointer", textAlign:"center",
            border:`2px solid ${provider===key ? val.color : C.border}`,
            background: provider===key ? val.color+"15" : C.card,
            transition:"all 0.2s",
          }}>
            <div style={{ fontSize:13, fontWeight:700, color: provider===key ? val.color : C.dark }}>
              {key==="groq" ? "⚡ Groq" : "🤖 Claude"}
            </div>
            <div style={{ fontSize:10, color:C.muted, marginTop:3 }}>
              {key==="groq" ? "Free forever" : "Paid plan"}
            </div>
            {key==="groq" && <div style={{ fontSize:9, color:val.color, fontWeight:700, marginTop:2 }}>RECOMMENDED</div>}
          </div>
        ))}
      </div>

      {/* Info banner */}
      <div style={{ background:info.color+"12", borderRadius:12, border:`1.5px solid ${info.color}30`, padding:"10px 14px", marginBottom:16 }}>
        <div style={{ fontSize:12, color:info.color, fontWeight:700, marginBottom:2 }}>{info.name}</div>
        <div style={{ fontSize:12, color:C.muted, lineHeight:1.5 }}>{info.note}</div>
      </div>

      {/* How to get key */}
      <div style={{ background:C.card, borderRadius:16, border:`1.5px solid ${C.border}`, overflow:"hidden", marginBottom:16 }}>
        <div style={{ background:info.color, padding:"10px 14px" }}>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.9)", fontWeight:700, letterSpacing:"0.05em" }}>
            HOW TO GET YOUR FREE KEY
          </div>
        </div>
        <div style={{ padding:"14px" }}>
          {info.steps.map((step, i)=>(
            <div key={i} style={{ display:"flex", gap:10, marginBottom: i<info.steps.length-1?10:0, alignItems:"flex-start" }}>
              <div style={{
                width:22, height:22, borderRadius:"50%", background:info.color,
                display:"flex", alignItems:"center", justifyContent:"center",
                color:"#fff", fontWeight:800, fontSize:11, flexShrink:0,
              }}>{i+1}</div>
              <div style={{ fontSize:13, color:C.dark, paddingTop:2, lineHeight:1.4 }}>{step}</div>
            </div>
          ))}
        </div>
      </div>

      {/* API Key input */}
      <div style={{ fontSize:10, color:C.muted, fontWeight:700, marginBottom:6, letterSpacing:"0.05em" }}>PASTE YOUR API KEY</div>
      <div style={{ position:"relative", marginBottom:10 }}>
        <input
          value={input}
          onChange={e=>{ setInput(e.target.value); setSaved(false); setTestMsg(""); }}
          type={show ? "text" : "password"}
          placeholder={info.placeholder}
          style={{
            width:"100%", border:`1.5px solid ${saved ? C.peacock : C.border}`, borderRadius:12,
            padding:"11px 44px 11px 14px", fontSize:13, outline:"none",
            background:C.jasmine, fontFamily:"monospace", boxSizing:"border-box", color:C.dark,
          }}
        />
        <button onClick={()=>setShow(s=>!s)} style={{
          position:"absolute", right:12, top:"50%", transform:"translateY(-50%)",
          background:"none", border:"none", cursor:"pointer", fontSize:16, color:C.muted,
        }}>{show ? "🙈" : "👁️"}</button>
      </div>

      {saved && _apiKey && (
        <div style={{ fontSize:12, color:C.peacock, fontWeight:600, marginBottom:10 }}>
          ✅ Key saved — AI features are active ({provider === "groq" ? "Groq / Llama 3" : "Claude"})
        </div>
      )}
      {testMsg && (
        <div style={{ fontSize:12, color: testMsg.startsWith("✅")?C.peacock:C.kumkum, fontWeight:600, marginBottom:10 }}>
          {testMsg}
        </div>
      )}

      <div style={{ display:"flex", gap:8, marginBottom:10 }}>
        <button onClick={test} disabled={!input.trim()||testing} style={{
          flex:1, background:C.sandal, border:`1.5px solid ${C.border}`, borderRadius:11,
          padding:"11px", cursor:input.trim()?"pointer":"not-allowed", fontSize:13, color:C.dark, fontWeight:600,
        }}>{testing ? "Testing…" : "🧪 Test Key"}</button>
        <button onClick={save} disabled={!input.trim()} style={{
          flex:2, background:input.trim()?info.color:C.muted, border:"none", borderRadius:11,
          padding:"11px", cursor:input.trim()?"pointer":"not-allowed", fontSize:14, color:"#fff", fontWeight:700,
        }}>Save API Key ✓</button>
      </div>

      {_apiKey && (
        <button onClick={()=>{ _apiKey=""; setInput(""); setSaved(false); setTestMsg(""); }} style={{
          width:"100%", background:"none", border:`1px solid ${C.kumkum}50`,
          borderRadius:11, padding:"9px", cursor:"pointer", color:C.kumkum, fontSize:12, fontWeight:600, marginBottom:20,
        }}>🗑 Remove saved key</button>
      )}

      {/* Warning */}
      <div style={{ background:C.turmeric+"18", borderRadius:14, border:`1.5px solid ${C.turmeric}40`, padding:"12px 14px" }}>
        <div style={{ fontSize:12, fontWeight:700, color:C.turmeric, marginBottom:4 }}>⚠️ Keep your API key private</div>
        <div style={{ fontSize:12, color:C.muted, lineHeight:1.5 }}>
          Never share your key publicly. Each person using the app should enter their own key. API usage is charged to the key owner.
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PROFILE SYSTEM
// ═══════════════════════════════════════════════════════════════════════════
const PROFILE_COLORS = [C.saffron, C.kumkum, C.peacock, C.indigo, C.turmeric, C.clay, "#9B59B6", "#16A085"];
const PROFILE_AVATARS = ["🌸","🌺","🌻","🌼","🍀","🌙","⭐","🦋","🪷","🌹"];

function getInitials(name) {
  return name.trim().split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase() || "?";
}

function ProfileAvatar({ profile, size=34, fontSize=13 }) {
  return (
    <div style={{
      width:size, height:size, borderRadius:"50%", flexShrink:0,
      background: profile.color || C.saffron,
      display:"flex", alignItems:"center", justifyContent:"center",
      fontWeight:800, fontSize, color:"#fff",
      boxShadow:"0 2px 8px rgba(0,0,0,0.18)",
      letterSpacing:"0.02em",
    }}>
      {getInitials(profile.name)}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ROOT APP
// ═══════════════════════════════════════════════════════════════════════════
export default function App() {
  const [activeTab,     setActiveTab]     = useState("home");
  // tasks keyed by profile id so each profile has its own list
  const [tasksByProfile,   setTasksByProfile]   = useState({});
  // budget keyed by profile id
  const [budgetByProfile,  setBudgetByProfile]  = useState({});  // { [id]: { salary, expenses } }
  const [profiles,      setProfiles]      = useState([
    { id:1, name:"My Profile", color:C.saffron, avatar:"🌸" }
  ]);
  const [activeProfile, setActiveProfile] = useState(0); // index
  const [profileOpen,   setProfileOpen]   = useState(false);
  const [addingProfile, setAddingProfile] = useState(false);
  const [editingIdx,    setEditingIdx]    = useState(null);
  const [draftName,     setDraftName]     = useState("");
  const [draftColor,    setDraftColor]    = useState(C.saffron);

  const profile = profiles[activeProfile] || profiles[0];

  const openAdd = () => { setDraftName(""); setDraftColor(PROFILE_COLORS[profiles.length % PROFILE_COLORS.length]); setAddingProfile(true); setEditingIdx(null); };
  const openEdit = (i) => { setDraftName(profiles[i].name); setDraftColor(profiles[i].color); setEditingIdx(i); setAddingProfile(true); };

  const deleteProfile = (i) => {
    if (profiles.length === 1) return;
    setProfiles(ps => ps.filter((_,pi)=>pi!==i));
    setActiveProfile(Math.max(0, activeProfile >= i ? activeProfile-1 : activeProfile));
    setAddingProfile(false);
  };

  const switchProfile = (i) => { setActiveProfile(i); setProfileOpen(false); };

  // Per-profile tasks helpers
  const profileTasks = tasksByProfile[profile.id] ?? [];
  const setProfileTasks = (updater) => setTasksByProfile(prev => ({
    ...prev,
    [profile.id]: typeof updater === "function" ? updater(prev[profile.id] ?? []) : updater,
  }));

  // Per-profile budget helpers
  const profileBudget   = budgetByProfile[profile.id] || { salary: null, expenses: [] };
  const setProfileSalary   = (s) => setBudgetByProfile(prev => ({ ...prev, [profile.id]: { ...( prev[profile.id]||{expenses:[]} ), salary: s } }));
  const setProfileExpenses = (updater) => setBudgetByProfile(prev => {
    const cur = prev[profile.id] || { salary: null, expenses: [] };
    return { ...prev, [profile.id]: { ...cur, expenses: typeof updater === "function" ? updater(cur.expenses) : updater } };
  });

  // When a new profile is created, seed it with fresh default tasks
  const saveProfile = () => {
    if (!draftName.trim()) return;
    if (editingIdx !== null) {
      setProfiles(ps => ps.map((p,i) => i===editingIdx ? {...p, name:draftName.trim(), color:draftColor} : p));
    } else {
      const np = { id:Date.now(), name:draftName.trim(), color:draftColor };
      setProfiles(ps => [...ps, np]);
      setTasksByProfile(prev => ({ ...prev, [np.id]: [] }));
      setActiveProfile(profiles.length);
    }
    setAddingProfile(false); setEditingIdx(null);
  };
  const [tabByProfile, setTabByProfile] = useState({});
  const currentTab = tabByProfile[profile.id] || "home";
  const setCurrentTab = (t) => setTabByProfile(prev => ({...prev, [profile.id]:t}));

  return (
    <div style={{ maxWidth:480, margin:"0 auto", minHeight:"100vh", background:C.jasmine, fontFamily:"'Trebuchet MS', Verdana, sans-serif", position:"relative" }}>

      {/* ── Top header ── */}
      <header style={{
        background: C.dark,
        padding:"12px 16px 10px",
        display:"flex", alignItems:"center", gap:10,
        position:"sticky", top:0, zIndex:100,
        boxShadow:"0 3px 20px rgba(0,0,0,0.2)",
      }}>
        {/* Rangoli accent */}
        <div style={{ display:"flex", flexDirection:"column", gap:2, alignItems:"center" }}>
          {[C.kumkum, C.turmeric, C.saffron].map((c,i)=><RangoliDot key={i} color={c} size={5}/>)}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:"'Georgia',serif", fontSize:19, color:C.marigold, fontStyle:"italic", letterSpacing:"-0.3px" }}>
            Smart Home
          </div>
          <div style={{ fontSize:9, color:C.muted, letterSpacing:"0.1em" }}>YOUR HOME, YOUR KINGDOM</div>
        </div>

        {/* Profile pill — Gmail style */}
        <button onClick={()=>setProfileOpen(o=>!o)} style={{
          display:"flex", alignItems:"center", gap:8, background:"rgba(255,255,255,0.08)",
          border:`1.5px solid rgba(255,255,255,0.12)`, borderRadius:24,
          padding:"5px 10px 5px 5px", cursor:"pointer", transition:"background 0.2s",
        }}>
          <ProfileAvatar profile={profile} size={28} fontSize={11} />
          <span style={{ fontSize:12, color:"rgba(255,255,255,0.85)", fontWeight:600, maxWidth:80,
            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {profile.name}
          </span>
          <span style={{ fontSize:10, color:"rgba(255,255,255,0.5)" }}>▾</span>
        </button>
      </header>

      {/* ── Profile dropdown ── */}
      {profileOpen && (
        <>
          <div onClick={()=>setProfileOpen(false)} style={{
            position:"fixed", inset:0, zIndex:150, background:"rgba(0,0,0,0.3)"
          }} />
          <div style={{
            position:"fixed", top:58, right: "calc(50% - 230px)", zIndex:160,
            background:C.card, borderRadius:18, width:280,
            boxShadow:"0 8px 32px rgba(0,0,0,0.22)", overflow:"hidden",
            border:`1.5px solid ${C.border}`,
          }}>
            {/* Header */}
            <div style={{ padding:"14px 16px 10px", background:C.dark }}>
              <div style={{ fontSize:10, color:C.muted, fontWeight:700, letterSpacing:"0.08em", marginBottom:10 }}>PROFILES</div>
              {/* All profiles list */}
              {profiles.map((p,i)=>(
                <div key={p.id} style={{
                  display:"flex", alignItems:"center", gap:10, padding:"8px 10px",
                  borderRadius:12, marginBottom:4, cursor:"pointer",
                  background: i===activeProfile ? "rgba(255,255,255,0.1)" : "transparent",
                  transition:"background 0.15s",
                }} onClick={()=>switchProfile(i)}>
                  <ProfileAvatar profile={p} size={36} fontSize={13} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, color:"#fff", fontWeight: i===activeProfile?700:400,
                      overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.name}</div>
                    {i===activeProfile && <div style={{ fontSize:10, color:C.turmeric, marginTop:1 }}>Active ✓</div>}
                  </div>
                  <button onClick={e=>{ e.stopPropagation(); openEdit(i); setProfileOpen(false); }} style={{
                    background:"none", border:"none", color:C.muted, cursor:"pointer", fontSize:14, padding:"2px 4px",
                  }}>✏️</button>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div style={{ padding:"10px 12px 12px" }}>
              <button onClick={()=>{ setProfileOpen(false); openAdd(); }} style={{
                width:"100%", display:"flex", alignItems:"center", gap:10,
                background:C.sandal, border:`1.5px solid ${C.border}`, borderRadius:12,
                padding:"10px 14px", cursor:"pointer", transition:"background 0.15s",
              }}>
                <div style={{ width:34, height:34, borderRadius:"50%", background:C.border,
                  display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>+</div>
                <span style={{ fontSize:13, color:C.dark, fontWeight:600 }}>Add another profile</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Add / Edit profile modal ── */}
      {addingProfile && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:200,
          display:"flex", alignItems:"flex-end", justifyContent:"center" }}
          onClick={()=>setAddingProfile(false)}>
          <div onClick={e=>e.stopPropagation()} style={{
            background:C.card, borderRadius:"20px 20px 0 0",
            padding:"22px 20px 38px", width:"100%", maxWidth:480,
            boxShadow:"0 -8px 30px rgba(0,0,0,0.2)",
          }}>
            <div style={{ width:40, height:4, background:C.border, borderRadius:4, margin:"0 auto 20px" }} />

            {/* Preview */}
            <div style={{ display:"flex", justifyContent:"center", marginBottom:20 }}>
              <div style={{
                width:64, height:64, borderRadius:"50%", background:draftColor,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontWeight:800, fontSize:22, color:"#fff",
                boxShadow:`0 4px 16px ${draftColor}60`,
                transition:"background 0.2s",
              }}>
                {getInitials(draftName) || "?"}
              </div>
            </div>

            <div style={{ fontSize:10, color:C.muted, fontWeight:700, marginBottom:6, letterSpacing:"0.05em" }}>
              {editingIdx!==null?"EDIT PROFILE NAME":"PROFILE NAME"}
            </div>
            <input
              autoFocus
              value={draftName}
              onChange={e=>setDraftName(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&saveProfile()}
              placeholder="e.g. Sunita, Maa, Amma…"
              style={{
                width:"100%", border:`2px solid ${draftColor}`, borderRadius:12,
                padding:"11px 14px", fontSize:15, outline:"none",
                background:C.jasmine, fontFamily:"inherit", boxSizing:"border-box", marginBottom:18,
              }}
            />

            {/* Color picker */}
            <div style={{ fontSize:10, color:C.muted, fontWeight:700, marginBottom:10, letterSpacing:"0.05em" }}>PICK A COLOUR</div>
            <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:22 }}>
              {PROFILE_COLORS.map(col=>(
                <div key={col} onClick={()=>setDraftColor(col)} style={{
                  width:32, height:32, borderRadius:"50%", background:col, cursor:"pointer",
                  border:`3px solid ${draftColor===col?"#fff":"transparent"}`,
                  boxShadow: draftColor===col?`0 0 0 2.5px ${col}`:"none",
                  transition:"all 0.15s",
                }} />
              ))}
            </div>

            <div style={{ display:"flex", gap:10 }}>
              <button onClick={()=>setAddingProfile(false)} style={{
                flex:1, background:C.sandal, border:`1.5px solid ${C.border}`, borderRadius:12,
                padding:"12px", cursor:"pointer", fontSize:13, color:C.muted, fontWeight:600,
              }}>Cancel</button>
              <button onClick={saveProfile} disabled={!draftName.trim()} style={{
                flex:2, background:draftName.trim()?draftColor:C.muted, border:"none",
                borderRadius:12, padding:"12px", fontSize:14, color:"#fff", fontWeight:700,
                cursor:draftName.trim()?"pointer":"not-allowed", transition:"background 0.2s",
              }}>
                {editingIdx!==null?"Save Changes":"Create Profile"}
              </button>
            </div>

            {/* Delete — only if not last profile and editing */}
            {editingIdx!==null && profiles.length>1 && (
              <button onClick={()=>deleteProfile(editingIdx)} style={{
                marginTop:12, width:"100%", background:"none", border:`1px solid ${C.kumkum}50`,
                borderRadius:12, padding:"10px", cursor:"pointer", color:C.kumkum, fontSize:12, fontWeight:600,
              }}>🗑 Delete this profile</button>
            )}
          </div>
        </div>
      )}

      {/* Screen content */}
      <main key={profile.id}>{
        currentTab==="home"     ? <HomeScreen tasks={profileTasks} setTasks={setProfileTasks} profileName={profile.name} totalSpent={profileBudget.expenses.reduce((s,e)=>s+e.amt,0)} salary={profileBudget.salary} />     :
        currentTab==="meals"    ? <MealsScreen/>    :
        currentTab==="festival" ? <FestivalScreen/> :
        currentTab==="budget"   ? <BudgetScreen salary={profileBudget.salary} setSalary={setProfileSalary} expenses={profileBudget.expenses} setExpenses={setProfileExpenses} />   :
        currentTab==="settings" ? <SettingsScreen/> :
                                  <KidsScreen/>
      }</main>

      {/* Bottom nav */}
      <nav style={{
        position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)",
        width:"100%", maxWidth:480,
        background:C.dark, borderTop:`2px solid ${C.saffron}40`,
        display:"flex", boxShadow:"0 -4px 20px rgba(0,0,0,0.2)", zIndex:100,
      }}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setCurrentTab(t.id)} style={{
            flex:1, background:"none", border:"none", cursor:"pointer",
            padding:"10px 4px 12px",
            borderTop: currentTab===t.id ? `3px solid ${profile.color||C.saffron}` : "3px solid transparent",
            color: currentTab===t.id ? (profile.color||C.saffron) : C.muted,
            transition:"all 0.2s",
            display:"flex", flexDirection:"column", alignItems:"center", gap:3,
          }}>
            <span style={{ fontSize:20 }}>{t.icon}</span>
            <span style={{ fontSize:10, fontWeight: currentTab===t.id?700:400, letterSpacing:"0.03em" }}>{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
