import { useEffect, useRef, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
const STORAGE_KEY = "noor-education-auth";

const marketingFeatures = [
  {
    icon: "📚",
    title: "إعداد أسهل للدروس",
    desc: "خطط لحصصك بسرعة واستفد من ملفات وتجهيزات تساعدك قبل كل درس.",
  },
  {
    icon: "🤝",
    title: "المجنمع التربوي ",
    desc: "شارك أفكارك وتجاربك اليومية مع باقي المعلمين داخل مساحة واحدة.",
  },
  {
    icon: "🌿",
    title: "الركن الأخضر",
    desc: "زاوية منظمة تحتوي على ملفات مفيدة تساعد في التحضير للمقررات.",
  },
];

const subjectOptions = [
  "الرياضيات",
  "العلوم",
  "اللغة العربية",
  "اللغة الإنجليزية",
  "التاريخ والجغرافيا",
  "التربية الإسلامية",
  "أخرى",
];

// ── Civil society associations ──────────────────────────────────────────────
const civilSocietyAssociations = [
  {
    id: 1,
    name: "جمعية واحة العلوم",
    responsible: "حسن دحمان",
    phone: "+21696889798",
    icon: "🔬",
  },
  {
    id: 2,
    name: "منتدى المبادرة و التربية و التنمية المحلية بالمطوية",
    responsible: "نزار حامد",
    phone: "+21690112309",
    icon: "🌱",
  },
  {
    id: 3,
    name: "الغرفة الفتية الاقتصادية بالمطوية",
    responsible: "حازم بن حسن",
    phone: "+21654945918",
    icon: "💼",
  },
  {
    id: 4,
    name: "الكشافة التونسية - فوج الأمل بالمطوية",
    responsible: "محمد العريبي",
    phone: "+21622296919",
    icon: "⚜️",
  },
];

// ── Static resource links shown in Green Corner ─────────────────────────────
const staticResourceLinks = [
  {
    id: "kahoot",
    title: "Kahoot!",
    description: "أداة تفاعلية لإنشاء اختبارات ومسابقات داخل الفصل الدراسي.",
    url: "https://share.google/7FRtQtW12Y0OiCReP",
    icon: "🎮",
    tag: "تفاعلي",
  },
  {
    id: "genially",
    title: "Genially",
    description: "منصة لإنشاء عروض تقديمية وإنفوغرافيك ومحتوى تعليمي بصري.",
    url: "https://share.google/x7HiPKAiqLyZp3k9e",
    icon: "✨",
    tag: "تصميم",
  },
];

const accountTabs = [
  { id: "community", label: "المجتمع التربوي" },
  { id: "civil-society", label: "المجتمع المدني" },
  { id: "green-corner", label: "الركن الأخضر" },
  { id: "dashboard", label: "لوحتي" },
];

const emptyLoginForm = { email: "", password: "" };
const emptySignupForm = {
  firstName: "",
  lastName: "",
  email: "",
  subject: "",
  password: "",
  confirmPassword: "",
};

function fullName(teacher) {
  return [teacher?.first_name, teacher?.last_name].filter(Boolean).join(" ");
}

function getInitials(teacher) {
  const source = fullName(teacher);
  return source
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const payload = await response
    .json()
    .catch(() => ({ success: false, message: "تعذر قراءة استجابة الخادم." }));
  if (!response.ok) throw new Error(payload.message || "حدث خطأ غير متوقع.");
  return payload;
}

function saveAuthSession(session) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}
function loadAuthSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function clearAuthSession() {
  localStorage.removeItem(STORAGE_KEY);
}

// ════════════════════════════════════════════════════════════════════════════
// LEAFY CHATBOT
// ════════════════════════════════════════════════════════════════════════════
function LeafyChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "مرحبًا! أنا Leafy 🌿، مساعدك الذكي في المنص . كيف يمكنني مساعدتك اليوم؟",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pulse, setPulse] = useState(true);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) setPulse(false);
  }, [open]);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: "user", content: text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system:
            "أنت Leafy، المساعد الذكي لمنصة نور تعليم التعليمية. تساعد المعلمين في التحضير للدروس، وتقديم أفكار تعليمية، والإجابة على أسئلتهم. ردودك باللغة العربية دائمًا، وأسلوبك ودّي ومشجع ومختصر.",
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await response.json();
      const reply =
        data?.content?.[0]?.text ||
        "عذرًا، لم أتمكن من الرد في الوقت الحالي. حاول مجددًا.";

      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "حدث خطأ في الاتصال. تأكد من اتصالك بالإنترنت وحاول مرة أخرى.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <>
      <button
        className={`leafy-fab ${pulse ? "leafy-fab--pulse" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-label="فتح المساعد الذكي Leafy"
        title="Leafy – المساعد الذكي"
      >
        {open ? (
          <span className="leafy-fab__close">✕</span>
        ) : (
          <span className="leafy-fab__icon">🌿</span>
        )}
        {!open && (
          <span className="leafy-fab__badge">
            <span className="leafy-fab__badge-dot" />
          </span>
        )}
      </button>

      {open && (
        <div className="leafy-window" dir="rtl">
          <div className="leafy-header">
            <div className="leafy-header__avatar">🌿</div>
            <div className="leafy-header__info">
              <strong>Leafy – المساعد الذكي</strong>
              <span>مساعدك التعليمي الذكي</span>
            </div>
            <div className="leafy-header__status">
              <span className="leafy-status-dot" />
              متصل
            </div>
          </div>

          <div className="leafy-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`leafy-msg leafy-msg--${msg.role}`}>
                {msg.role === "assistant" && (
                  <div className="leafy-msg__avatar">🌿</div>
                )}
                <div className="leafy-msg__bubble">{msg.content}</div>
              </div>
            ))}
            {loading && (
              <div className="leafy-msg leafy-msg--assistant">
                <div className="leafy-msg__avatar">🌿</div>
                <div className="leafy-msg__bubble leafy-msg__bubble--typing">
                  <span /><span /><span />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="leafy-input-row">
            <textarea
              ref={inputRef}
              className="leafy-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="اكتب سؤالك هنا..."
              rows={1}
              disabled={loading}
            />
            <button
              className="leafy-send"
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              aria-label="إرسال"
            >
              ➤
            </button>
          </div>
        </div>
      )}

      <style>{`
        .leafy-fab {
          position: fixed;
          bottom: 28px;
          right: 28px;
          z-index: 9999;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          border: none;
          cursor: pointer;
          background: linear-gradient(135deg, #2d8a4e 0%, #52c97a 100%);
          box-shadow: 0 4px 20px rgba(45,138,78,0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 26px;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .leafy-fab:hover { transform: scale(1.08); box-shadow: 0 6px 28px rgba(45,138,78,0.55); }
        .leafy-fab--pulse { animation: leafy-pulse 2.2s infinite; }
        @keyframes leafy-pulse {
          0%,100% { box-shadow: 0 4px 20px rgba(45,138,78,0.45); }
          50% { box-shadow: 0 4px 32px rgba(45,138,78,0.75), 0 0 0 10px rgba(82,201,122,0.15); }
        }
        .leafy-fab__close { font-size: 20px; color: #fff; font-weight: 700; }
        .leafy-fab__icon { font-size: 28px; }
        .leafy-fab__badge {
          position: absolute; top: 4px; right: 4px;
          width: 14px; height: 14px; border-radius: 50%;
          background: #fff;
          display: flex; align-items: center; justify-content: center;
        }
        .leafy-fab__badge-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: #22c55e;
          animation: leafy-blink 1.6s infinite;
        }
        @keyframes leafy-blink { 0%,100% { opacity:1; } 50% { opacity:0.35; } }

        .leafy-window {
          position: fixed;
          bottom: 100px; right: 28px;
          z-index: 9998;
          width: 360px; max-height: 520px;
          border-radius: 20px;
          background: #fff;
          box-shadow: 0 12px 48px rgba(0,0,0,0.18);
          display: flex; flex-direction: column;
          overflow: hidden;
          animation: leafy-slide-in 0.28s cubic-bezier(.34,1.3,.7,1) both;
          font-family: 'Segoe UI', Tahoma, sans-serif;
        }
        @keyframes leafy-slide-in {
          from { opacity:0; transform: translateY(24px) scale(0.95); }
          to   { opacity:1; transform: translateY(0) scale(1); }
        }
        .leafy-header {
          display: flex; align-items: center; gap: 10px;
          padding: 14px 16px;
          background: linear-gradient(135deg, #2d8a4e 0%, #43b56d 100%);
          color: #fff;
        }
        .leafy-header__avatar {
          width: 40px; height: 40px; border-radius: 50%;
          background: rgba(255,255,255,0.2);
          display: flex; align-items: center; justify-content: center;
          font-size: 20px; flex-shrink: 0;
        }
        .leafy-header__info { flex: 1; }
        .leafy-header__info strong { display: block; font-size: 14px; }
        .leafy-header__info span { font-size: 11px; opacity: 0.85; }
        .leafy-header__status { display: flex; align-items: center; gap: 5px; font-size: 11px; opacity: 0.9; }
        .leafy-status-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: #a3f4bf; animation: leafy-blink 1.6s infinite;
        }
        .leafy-messages {
          flex: 1; overflow-y: auto; padding: 14px 12px;
          display: flex; flex-direction: column; gap: 10px;
          background: #f7fbf9;
        }
        .leafy-msg { display: flex; align-items: flex-end; gap: 7px; }
        .leafy-msg--user { flex-direction: row-reverse; }
        .leafy-msg__avatar {
          width: 28px; height: 28px; border-radius: 50%;
          background: #d1fae5;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; flex-shrink: 0;
        }
        .leafy-msg__bubble {
          max-width: 76%; padding: 9px 13px; border-radius: 16px;
          font-size: 13.5px; line-height: 1.55;
          white-space: pre-wrap; word-break: break-word;
        }
        .leafy-msg--assistant .leafy-msg__bubble {
          background: #fff; border: 1px solid #e2f4ea; color: #1a2e1e;
          border-bottom-right-radius: 4px;
        }
        .leafy-msg--user .leafy-msg__bubble {
          background: linear-gradient(135deg,#2d8a4e,#52c97a);
          color: #fff; border-bottom-left-radius: 4px;
        }
        .leafy-msg__bubble--typing {
          display: flex; align-items: center; gap: 4px; padding: 12px 16px;
        }
        .leafy-msg__bubble--typing span {
          width: 7px; height: 7px; border-radius: 50%;
          background: #6ec88b; animation: leafy-bounce 1.2s infinite;
        }
        .leafy-msg__bubble--typing span:nth-child(2) { animation-delay: 0.18s; }
        .leafy-msg__bubble--typing span:nth-child(3) { animation-delay: 0.36s; }
        @keyframes leafy-bounce {
          0%,80%,100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
        .leafy-input-row {
          display: flex; align-items: flex-end; gap: 8px;
          padding: 10px 12px; border-top: 1px solid #e8f5ee; background: #fff;
        }
        .leafy-input {
          flex: 1; border: 1.5px solid #c6e8d3; border-radius: 12px;
          padding: 9px 12px; font-size: 13.5px; resize: none; outline: none;
          font-family: inherit; direction: rtl; max-height: 90px;
          line-height: 1.4; color: #1a2e1e; transition: border-color 0.2s;
        }
        .leafy-input:focus { border-color: #2d8a4e; }
        .leafy-send {
          width: 38px; height: 38px; border-radius: 50%; border: none;
          background: linear-gradient(135deg,#2d8a4e,#52c97a);
          color: #fff; font-size: 16px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; transition: opacity 0.2s, transform 0.15s;
        }
        .leafy-send:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }
        .leafy-send:not(:disabled):hover { transform: scale(1.08); }
        @media (max-width: 440px) {
          .leafy-window { width: calc(100vw - 24px); right: 12px; bottom: 88px; }
          .leafy-fab { bottom: 18px; right: 16px; }
        }
      `}</style>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// CIVIL SOCIETY TAB
// ════════════════════════════════════════════════════════════════════════════
function CivilSocietySection() {
  return (
    <section className="account-section">
      <div className="section-heading account-heading">
        <span className="section-tag">المجتمع المدني</span>
        <h2>جمعيات ومنظمات شريكة</h2>
        <p>
          هذه الجمعيات والمنظمات المدنية شريكة في دعم التعليم والتنمية المحلية بالمطوية.
          تواصل معها مباشرة عبر أرقام المسؤولين.
        </p>
      </div>

      <div className="civil-grid">
        {civilSocietyAssociations.map((assoc) => (
          <article className="civil-card" key={assoc.id}>
            <div className="civil-card__icon">{assoc.icon}</div>
            <div className="civil-card__body">
              <h3>{assoc.name}</h3>
              <div className="civil-card__detail">
                <span className="civil-label">المسؤول</span>
                <strong>{assoc.responsible}</strong>
              </div>
              <div className="civil-card__detail">
                <span className="civil-label">الهاتف</span>
                <a href={`tel:${assoc.phone}`} className="civil-phone" dir="ltr">
                  {assoc.phone}
                </a>
              </div>
            </div>
            <a
              href={`https://wa.me/${assoc.phone.replace(/\+/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="civil-wa-btn"
              title="تواصل عبر واتساب"
            >
              💬 واتساب
            </a>
          </article>
        ))}
      </div>

      <style>{`
        .civil-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
          gap: 18px; margin-top: 24px;
        }
        .civil-card {
          background: #fff; border: 1.5px solid #e2f4ea; border-radius: 16px;
          padding: 20px; display: flex; flex-direction: column; gap: 12px;
          transition: box-shadow 0.2s, transform 0.2s;
        }
        .civil-card:hover { box-shadow: 0 6px 24px rgba(45,138,78,0.12); transform: translateY(-2px); }
        .civil-card__icon {
          font-size: 32px; width: 54px; height: 54px; border-radius: 14px;
          background: #f0faf4; display: flex; align-items: center; justify-content: center;
        }
        .civil-card__body h3 { font-size: 15px; font-weight: 700; color: #1a3a25; margin: 0 0 10px; line-height: 1.4; }
        .civil-card__detail { display: flex; align-items: center; gap: 8px; margin-bottom: 5px; }
        .civil-label {
          font-size: 12px; color: #6b7280; background: #f3f4f6;
          padding: 2px 8px; border-radius: 20px; white-space: nowrap;
        }
        .civil-card__detail strong { font-size: 14px; color: #1a3a25; }
        .civil-phone { font-size: 13.5px; color: #2d8a4e; font-weight: 600; text-decoration: none; letter-spacing: 0.3px; }
        .civil-phone:hover { text-decoration: underline; }
        .civil-wa-btn {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 13px; font-weight: 600; color: #fff;
          background: linear-gradient(135deg, #25d366, #128c3f);
          border-radius: 10px; padding: 8px 16px; text-decoration: none;
          align-self: flex-start; transition: opacity 0.2s;
        }
        .civil-wa-btn:hover { opacity: 0.88; }
      `}</style>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// GREEN CORNER
// ════════════════════════════════════════════════════════════════════════════
function GreenCornerSection({ resources }) {
  const [uploadedPdfs, setUploadedPdfs] = useState([]);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef(null);

  function handleFiles(files) {
    const pdfs = Array.from(files).filter((f) => f.type === "application/pdf");
    if (!pdfs.length) return;
    const newEntries = pdfs.map((f) => ({
      id: `pdf-${Date.now()}-${Math.random()}`,
      file: f,
      name: f.name,
      url: URL.createObjectURL(f),
      addedAt: new Date(),
    }));
    setUploadedPdfs((prev) => [...prev, ...newEntries]);
  }

  function removePdf(id) {
    setUploadedPdfs((prev) => {
      const entry = prev.find((p) => p.id === id);
      if (entry) URL.revokeObjectURL(entry.url);
      return prev.filter((p) => p.id !== id);
    });
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  return (
    <section className="account-section">
      <div className="section-heading account-heading">
        <span className="section-tag">الركن الأخضر</span>
        <h2>ملفات مفيدة لتحضير الدروس</h2>
        <p>هذه الزاوية مخصصة للمعلم الذي يريد ملفات جاهزة وأدوات تنظيمية تساعده قبل الحصة.</p>
      </div>

      {/* Static links */}
      <div className="gc-section-title"><span>🔗</span> روابط تعليمية مفيدة</div>
      <div className="gc-links-grid">
        {staticResourceLinks.map((link) => (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="gc-link-card"
          >
            <div className="gc-link-card__icon">{link.icon}</div>
            <div className="gc-link-card__body">
              <strong>{link.title}</strong>
              <span className="gc-link-tag">{link.tag}</span>
              <p>{link.description}</p>
            </div>
            <div className="gc-link-card__arrow">↗</div>
          </a>
        ))}
      </div>

      {/* API resources */}
      {resources && resources.length > 0 && (
        <>
          <div className="gc-section-title" style={{ marginTop: 28 }}><span>📂</span> ملفات المنصة</div>
          <div className="resource-grid">
            {resources.map((resource) => (
              <article className="resource-card" key={resource.id}>
                <div className="resource-meta">
                  <span>{resource.type}</span>
                  <span>{resource.category}</span>
                </div>
                <h3>{resource.title}</h3>
                <p>{resource.description}</p>
                <div className="resource-footer">
                  <small>آخر تحديث: {new Date(resource.updated_at).toLocaleDateString("en-GB")}</small>
                  <button className="btn btn-ghost" type="button">{resource.file_name}</button>
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      {/* PDF upload */}
      <div className="gc-section-title" style={{ marginTop: 28 }}><span>📄</span> إضافة ملف PDF خاص بك</div>
      <p className="gc-upload-hint">
        يمكنك رفع ملفات PDF للاستخدام الشخصي أثناء الجلسة. الملفات تبقى في المتصفح فقط ولا تُرفع إلى أي خادم.
      </p>

      <div
        className={`gc-drop-zone ${dragging ? "gc-drop-zone--active" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
      >
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf"
          multiple
          style={{ display: "none" }}
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="gc-drop-zone__icon">📎</div>
        <strong>اسحب ملف PDF هنا أو انقر للاختيار</strong>
        <span>يدعم ملفات PDF فقط</span>
      </div>

      {uploadedPdfs.length > 0 && (
        <div className="gc-pdf-list">
          {uploadedPdfs.map((pdf) => (
            <div className="gc-pdf-item" key={pdf.id}>
              <div className="gc-pdf-item__left">
                <span className="gc-pdf-item__icon">📄</span>
                <div>
                  <strong>{pdf.name}</strong>
                  <span>أضيف في {pdf.addedAt.toLocaleTimeString("ar-TN")}</span>
                </div>
              </div>
              <div className="gc-pdf-item__actions">
                <a href={pdf.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-small">فتح</a>
                <a href={pdf.url} download={pdf.name} className="btn btn-ghost btn-small">تنزيل</a>
                <button className="btn btn-ghost btn-small" onClick={() => removePdf(pdf.id)} title="حذف">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .gc-section-title {
          display: flex; align-items: center; gap: 8px;
          font-size: 15px; font-weight: 700; color: #1a3a25;
          margin-bottom: 14px; margin-top: 8px;
        }
        .gc-links-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px;
        }
        .gc-link-card {
          display: flex; align-items: flex-start; gap: 14px; padding: 16px;
          background: #fff; border: 1.5px solid #e2f4ea; border-radius: 14px;
          text-decoration: none; color: inherit;
          transition: box-shadow 0.2s, transform 0.2s, border-color 0.2s; position: relative;
        }
        .gc-link-card:hover { box-shadow: 0 6px 24px rgba(45,138,78,0.13); border-color: #2d8a4e; transform: translateY(-2px); }
        .gc-link-card__icon {
          font-size: 26px; width: 46px; height: 46px; border-radius: 12px;
          background: #f0faf4; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .gc-link-card__body { flex: 1; }
        .gc-link-card__body strong { display: block; font-size: 15px; color: #1a3a25; margin-bottom: 4px; }
        .gc-link-card__body p { font-size: 12.5px; color: #6b7280; margin: 4px 0 0; line-height: 1.5; }
        .gc-link-tag { font-size: 11px; background: #d1fae5; color: #065f46; padding: 2px 8px; border-radius: 20px; font-weight: 600; }
        .gc-link-card__arrow { font-size: 18px; color: #2d8a4e; font-weight: 700; }
        .gc-upload-hint { font-size: 13px; color: #6b7280; margin-bottom: 14px; line-height: 1.6; }
        .gc-drop-zone {
          border: 2px dashed #b4ddc3; border-radius: 16px; padding: 36px 24px;
          display: flex; flex-direction: column; align-items: center; gap: 8px;
          cursor: pointer; background: #f7fbf9;
          transition: background 0.2s, border-color 0.2s; text-align: center; margin-bottom: 18px;
        }
        .gc-drop-zone--active { background: #e8f5ee; border-color: #2d8a4e; }
        .gc-drop-zone:hover { background: #edf7f1; }
        .gc-drop-zone__icon { font-size: 36px; }
        .gc-drop-zone strong { font-size: 14px; color: #1a3a25; }
        .gc-drop-zone span { font-size: 12px; color: #9ca3af; }
        .gc-pdf-list { display: flex; flex-direction: column; gap: 10px; }
        .gc-pdf-item {
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
          background: #fff; border: 1.5px solid #e2f4ea; border-radius: 12px; padding: 12px 16px;
        }
        .gc-pdf-item__left { display: flex; align-items: center; gap: 12px; }
        .gc-pdf-item__icon { font-size: 22px; }
        .gc-pdf-item__left strong { display: block; font-size: 13.5px; color: #1a3a25; }
        .gc-pdf-item__left span { font-size: 11.5px; color: #9ca3af; }
        .gc-pdf-item__actions { display: flex; gap: 6px; align-items: center; }
      `}</style>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ROOT APP
// ════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [modal, setModal] = useState(null);
  const [auth, setAuth] = useState(() => loadAuthSession());
  const [booting, setBooting] = useState(true);
  const [activeTab, setActiveTab] = useState("community");
  const [loginForm, setLoginForm] = useState(emptyLoginForm);
  const [signupForm, setSignupForm] = useState(emptySignupForm);
  const [loginState, setLoginState] = useState({ loading: false, error: "" });
  const [signupState, setSignupState] = useState({ loading: false, error: "" });
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [posts, setPosts] = useState([]);
  const [resources, setResources] = useState([]);
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountError, setAccountError] = useState("");
  const [composerText, setComposerText] = useState("");
  const [composerLoading, setComposerLoading] = useState(false);
  const [composerError, setComposerError] = useState("");

  const isAuthenticated = Boolean(auth?.teacher && auth?.token);

  useEffect(() => {
    let cancelled = false;
    async function verifySession() {
      if (!auth?.token) { setBooting(false); return; }
      try {
        const data = await apiRequest("/api/auth/me", {
          method: "GET",
          headers: { Authorization: `Bearer ${auth.token}` },
        });
        if (!cancelled) {
          const session = { token: auth.token, teacher: data.teacher };
          setAuth(session); saveAuthSession(session);
        }
      } catch {
        if (!cancelled) { clearAuthSession(); setAuth(null); }
      } finally {
        if (!cancelled) setBooting(false);
      }
    }
    verifySession();
    return () => { cancelled = true; };
  }, [auth?.token]);

  useEffect(() => {
    let cancelled = false;
    async function loadAccountData() {
      if (!auth?.token) { setPosts([]); setResources([]); return; }
      setAccountLoading(true); setAccountError("");
      try {
        const [postsResponse, resourcesResponse] = await Promise.all([
          apiRequest("/api/community/posts", { method: "GET", headers: { Authorization: `Bearer ${auth.token}` } }),
          apiRequest("/api/green-corner/resources", { method: "GET", headers: { Authorization: `Bearer ${auth.token}` } }),
        ]);
        if (!cancelled) { setPosts(postsResponse.posts); setResources(resourcesResponse.resources); }
      } catch (error) {
        if (!cancelled) setAccountError(error.message);
      } finally {
        if (!cancelled) setAccountLoading(false);
      }
    }
    loadAccountData();
    return () => { cancelled = true; };
  }, [auth?.token]);

  function openModal(type) {
    setLoginState({ loading: false, error: "" });
    setSignupState({ loading: false, error: "" });
    setModal(type);
  }
  function closeModal() {
    setModal(null);
    setLoginState({ loading: false, error: "" });
    setSignupState({ loading: false, error: "" });
  }
  function updateLogin(field) { return (e) => setLoginForm((c) => ({ ...c, [field]: e.target.value })); }
  function updateSignup(field) { return (e) => setSignupForm((c) => ({ ...c, [field]: e.target.value })); }

  async function handleLogin(event) {
    event.preventDefault(); setLoginState({ loading: true, error: "" });
    try {
      const data = await apiRequest("/api/auth/login", { method: "POST", body: JSON.stringify(loginForm) });
      const session = { token: data.access_token, teacher: data.teacher };
      saveAuthSession(session); setAuth(session); setActiveTab("community");
      setLoginForm(emptyLoginForm); closeModal();
    } catch (error) { setLoginState({ loading: false, error: error.message }); return; }
    setLoginState({ loading: false, error: "" });
  }

  async function handleSignup(event) {
    event.preventDefault(); setSignupState({ loading: true, error: "" });
    try {
      const data = await apiRequest("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          first_name: signupForm.firstName, last_name: signupForm.lastName,
          email: signupForm.email, subject: signupForm.subject,
          password: signupForm.password, confirm_password: signupForm.confirmPassword,
        }),
      });
      const session = { token: data.access_token, teacher: data.teacher };
      saveAuthSession(session); setAuth(session); setActiveTab("community");
      setSignupForm(emptySignupForm); closeModal();
    } catch (error) { setSignupState({ loading: false, error: error.message }); return; }
    setSignupState({ loading: false, error: "" });
  }

  async function handleLogout() {
    if (!auth?.token) { clearAuthSession(); setAuth(null); return; }
    setLogoutLoading(true);
    try {
      await apiRequest("/api/auth/logout", { method: "POST", headers: { Authorization: `Bearer ${auth.token}` } });
    } catch { /* ignore */ } finally {
      clearAuthSession(); setAuth(null); setPosts([]); setResources([]);
      setComposerText(""); setActiveTab("community"); setLogoutLoading(false);
    }
  }

  async function handleCreatePost(event) {
    event.preventDefault(); setComposerLoading(true); setComposerError("");
    try {
      const response = await apiRequest("/api/community/posts", {
        method: "POST",
        headers: { Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({ content: composerText }),
      });
      setPosts((current) => [response.post, ...current]); setComposerText("");
    } catch (error) { setComposerError(error.message); }
    finally { setComposerLoading(false); }
  }

  async function handleDeletePost(postId) {
    try {
      await apiRequest(`/api/community/posts/${postId}`, { method: "DELETE", headers: { Authorization: `Bearer ${auth.token}` } });
      setPosts((current) => current.filter((post) => post.id !== postId));
    } catch (error) { alert(error.message); }
  }

  if (booting) {
    return (
      <div className="boot-screen">
        <div className="boot-card">
          <strong>جارٍ تجهيز المنصة...</strong>
          <span>نراجع حالة تسجيل الدخول ونجهز مساحة المعلم.</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {isAuthenticated ? (
        <AccountExperience
          teacher={auth.teacher}
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          onLogout={handleLogout}
          logoutLoading={logoutLoading}
          posts={posts}
          resources={resources}
          accountLoading={accountLoading}
          accountError={accountError}
          composerText={composerText}
          setComposerText={setComposerText}
          onCreatePost={handleCreatePost}
          composerLoading={composerLoading}
          composerError={composerError}
          onDeletePost={handleDeletePost}
        />
      ) : (
        <LandingExperience onOpenLogin={() => openModal("login")} onOpenSignup={() => openModal("signup")} />
      )}

      {modal === "login" && (
        <AuthModal title="تسجيل الدخول" subtitle="أدخل بريدك الإلكتروني وكلمة المرور ثم ادخل إلى حسابك مباشرة." onClose={closeModal}>
          <form className="auth-form" onSubmit={handleLogin}>
            <label>البريد الإلكتروني<input type="email" value={loginForm.email} onChange={updateLogin("email")} placeholder="teacher@example.com" autoComplete="email" /></label>
            <label>كلمة المرور<input type="password" value={loginForm.password} onChange={updateLogin("password")} placeholder="Password1" autoComplete="current-password" /></label>
            {loginState.error && <p className="form-message error">{loginState.error}</p>}
            <button className="btn btn-primary btn-block" type="submit" disabled={loginState.loading}>
              {loginState.loading ? "جارٍ تسجيل الدخول..." : "تسجيل الدخول"}
            </button>
            <p className="switch-text">ليس لديك حساب؟{" "}<button type="button" className="switch-link" onClick={() => openModal("signup")}>أنشئ حسابًا</button></p>
          </form>
        </AuthModal>
      )}

      {modal === "signup" && (
        <AuthModal title="إنشاء حساب" subtitle="أنشئ حساب معلم ثم ادخل مباشرة إلى المجتمع و GreenCorner." onClose={closeModal}>
          <form className="auth-form" onSubmit={handleSignup}>
            <div className="split-fields">
              <label>الاسم الأول<input value={signupForm.firstName} onChange={updateSignup("firstName")} placeholder="محمد" autoComplete="given-name" /></label>
              <label>اسم العائلة<input value={signupForm.lastName} onChange={updateSignup("lastName")} placeholder="الأحمد" autoComplete="family-name" /></label>
            </div>
            <label>البريد الإلكتروني<input type="email" value={signupForm.email} onChange={updateSignup("email")} placeholder="teacher@example.com" autoComplete="email" /></label>
            <label>المادة التي تدرّسها
              <select value={signupForm.subject} onChange={updateSignup("subject")}>
                <option value="">اختر المادة</option>
                {subjectOptions.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <div className="split-fields">
              <label>كلمة المرور<input type="password" value={signupForm.password} onChange={updateSignup("password")} placeholder="Password1" autoComplete="new-password" /></label>
              <label>تأكيد كلمة المرور<input type="password" value={signupForm.confirmPassword} onChange={updateSignup("confirmPassword")} placeholder="Password1" autoComplete="new-password" /></label>
            </div>
            <p className="password-hint">كلمة المرور يجب أن تكون 8 أحرف على الأقل وتحتوي على حرف كبير ورقم.</p>
            {signupState.error && <p className="form-message error">{signupState.error}</p>}
            <button className="btn btn-primary btn-block" type="submit" disabled={signupState.loading}>
              {signupState.loading ? "جارٍ إنشاء الحساب..." : "إنشاء الحساب"}
            </button>
            <p className="switch-text">لديك حساب بالفعل؟{" "}<button type="button" className="switch-link" onClick={() => openModal("login")}>سجّل الدخول</button></p>
          </form>
        </AuthModal>
      )}

      {/* Leafy chatbot — always visible */}
      <LeafyChatbot />
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// LANDING
// ════════════════════════════════════════════════════════════════════════════
function LandingExperience({ onOpenLogin, onOpenSignup }) {
  return (
    <>
      <nav className="nav">
        <a className="brand" href="#top">
          <span className="brand-mark">🌿</span>
          <span className="brand-copy"><span>أفق الاستدامة</span></span>
        </a>
        <div className="nav-links">
          <a href="#features">المميزات</a>
          <a href="#why">لماذا المنصة</a>
          <a href="#access">الدخول للحساب</a>
        </div>
        <div className="nav-actions">
          <button className="btn btn-outline" onClick={onOpenLogin}>تسجيل الدخول</button>
          <button className="btn btn-primary" onClick={onOpenSignup}>إنشاء حساب</button>
        </div>
      </nav>

      <main id="top">
        <section className="hero hero-landing">
          <div className="hero-copy">
            <span className="eyebrow">حساب المعلم يبدأ من هنا</span>
            <h1>سجّل الدخول ثم ادخل إلى<span> مجتمعك وملفاتك التعليمية</span></h1>
            <p>بعد تسجيل الدخول، يجد المعلم داخل حسابه أقسامًا واضحة في الشريط العلوي: Community للنشر والتفاعل، المجتمع المدني للجمعيات الشريكة، الركن الأخضر لملفات التحضير، ولوحة شخصية.</p>
            <div className="hero-actions">
              <button className="btn btn-primary btn-large" onClick={onOpenSignup}>ابدأ الآن</button>
              <button className="btn btn-ghost btn-large" onClick={onOpenLogin}>لدي حساب بالفعل</button>
            </div>
          </div>
          <div className="landing-preview">
            <div className="preview-card"><small>بعد الدخول</small><strong>المجنمع التربوي</strong><p>انشر فكرة أو سؤالًا أو تجربة صفية مع المعلمين.</p></div>
            <div className="preview-card"><small>بعد الدخول</small><strong>المجتمع المدني</strong><p>تواصل مع الجمعيات والمنظمات الشريكة في المنطقة.</p></div>
            <div className="preview-card"><small>بعد الدخول</small><strong>الركن الأخضر</strong><p>ملفات وأدوات جاهزة لمساعدتك في تحضير الدروس.</p></div>
          </div>
        </section>

        <section className="section" id="features">
          <div className="section-heading">
            <span className="section-tag">ماذا ستجد بعد الدخول</span>
            <h2>واجهة حساب منظمة للمعلم</h2>
            <p>تم تحويل تسجيل الدخول إلى بوابة حقيقية لحساب المعلم بدل أن يبقى مجرد نموذج فقط.</p>
          </div>
          <div className="feature-grid">
            {marketingFeatures.map((feature) => (
              <article className="feature-card" key={feature.title}>
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section section-dark" id="why">
          <div className="section-heading">
            <span className="section-tag section-tag-dark">التجربة الجديدة</span>
            <h2>الدخول يقودك مباشرة إلى الحساب</h2>
            <p>بدل البقاء في الصفحة الرئيسية، يتحول المعلم بعد المصادقة إلى مساحة خاصة به فيها تنقل علوي ومحتوى مرتبط بحسابه.</p>
          </div>
        </section>
      </main>

      <footer className="footer" id="access">
        <strong>أفق الاستدامة
</strong>
        <p>سجّل الدخول الآن لتجربة الحساب الجديد المخصص للمعلمين.</p>
      </footer>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ACCOUNT
// ════════════════════════════════════════════════════════════════════════════
function AccountExperience({
  teacher, activeTab, onChangeTab, onLogout, logoutLoading,
  posts, resources, accountLoading, accountError,
  composerText, setComposerText, onCreatePost, composerLoading, composerError, onDeletePost,
}) {
  return (
    <div className="account-page">
      <header className="account-topbar">
        <div className="account-brand">
          <div className="account-avatar">{getInitials(teacher) || "م"}</div>
          <div>
            <strong>{fullName(teacher)}</strong>
            <span>{teacher.subject || "معلم"}</span>
          </div>
        </div>
        <nav className="account-nav">
          {accountTabs.map((tab) => (
            <button key={tab.id} type="button" className={`account-tab ${activeTab === tab.id ? "active" : ""}`} onClick={() => onChangeTab(tab.id)}>
              {tab.label}
            </button>
          ))}
        </nav>
        <button className="btn btn-outline" onClick={onLogout} disabled={logoutLoading}>
          {logoutLoading ? "جارٍ تسجيل الخروج..." : "تسجيل الخروج"}
        </button>
      </header>

      <main className="account-main">
        <section className="account-hero">
          <div>
            <span className="eyebrow">حساب المعلم</span>
            <h1>مرحبًا {teacher.first_name}، هذه مساحتك داخل المنصة</h1>
            <p>استخدم الشريط العلوي للتنقل بين المجتمع، الركن الأخضر، ولوحتك الشخصية.</p>
          </div>
          <div className="mini-stat-grid">
            <div className="mini-stat"><strong>{posts.length}</strong><span>منشورات المجتمع</span></div>
            <div className="mini-stat"><strong>{resources.length}</strong><span>ملفات الركن الأخضر</span></div>
          </div>
        </section>

        {accountError && <p className="banner-error">{accountError}</p>}
        {accountLoading && <p className="banner-info">جارٍ تحميل محتوى الحساب...</p>}

        {activeTab === "community" && (
          <section className="account-section">
            <div className="section-heading account-heading">
              <span className="section-tag">Community</span>
              <h2>مساحة المعلمين للنشر والتفاعل</h2>
              <p>اكتب منشورًا، شارك فكرة من حصتك، أو اطلب مساعدة من المعلمين الآخرين.</p>
            </div>
            <form className="composer-card" onSubmit={onCreatePost}>
              <textarea value={composerText} onChange={(e) => setComposerText(e.target.value)} placeholder="اكتب هنا شيئًا تريد مشاركته مع المعلمين..." />
              {composerError && <p className="form-message error">{composerError}</p>}
              <div className="composer-actions">
                <span>كل منشور يظهر مباشرة داخل المجتمع.</span>
                <button className="btn btn-primary" type="submit" disabled={composerLoading}>{composerLoading ? "جارٍ النشر..." : "نشر"}</button>
              </div>
            </form>
            <div className="post-list">
              {posts.length === 0 ? (
                <div className="empty-card"><strong>لا توجد منشورات بعد</strong><span>كن أول معلم يشارك فكرة أو سؤالًا داخل المجتمع.</span></div>
              ) : (
                posts.map((post) => (
                  <article className="post-card" key={post.id}>
                    <div className="post-head">
                      <div className="post-avatar">{getInitials(post.author) || "م"}</div>
                      <div>
                        <strong>{fullName(post.author)}</strong>
                        <span>{new Date(post.created_at).toLocaleString("ar-EG")}</span>
                      </div>
                      {post.author.id === teacher.id && (
                        <button className="btn btn-ghost btn-small" onClick={() => onDeletePost(post.id)} title="حذف المنشور">🗑️</button>
                      )}
                    </div>
                    <p>{post.content}</p>
                  </article>
                ))
              )}
            </div>
          </section>
        )}

        {activeTab === "civil-society" && <CivilSocietySection />}

        {activeTab === "green-corner" && <GreenCornerSection resources={resources} />}

        {activeTab === "dashboard" && (
          <section className="account-section">
            <div className="section-heading account-heading">
              <span className="section-tag">لوحتي</span>
              <h2>ملخص سريع لحسابك</h2>
              <p>استخدم هذه اللوحة لمراجعة معلوماتك الأساسية ونشاطك داخل المنصة.</p>
            </div>
            <div className="dashboard-grid">
              <article className="dashboard-card">
                <h3>الملف الشخصي</h3>
                <ul className="detail-list">
                  <li><span>الاسم</span><strong>{fullName(teacher)}</strong></li>
                  <li><span>البريد الإلكتروني</span><strong>{teacher.email}</strong></li>
                  <li><span>المادة</span><strong>{teacher.subject || "غير محددة"}</strong></li>
                </ul>
              </article>
              <article className="dashboard-card">
                <h3>ملخص النشاط</h3>
                <ul className="detail-list">
                  <li><span>عدد المنشورات</span><strong>{posts.length}</strong></li>
                  <li><span>عدد الملفات المتاحة</span><strong>{resources.length}</strong></li>
                  <li><span>أول قسم موصى به</span><strong>Community</strong></li>
                </ul>
              </article>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// AUTH MODAL
// ════════════════════════════════════════════════════════════════════════════
function AuthModal({ title, subtitle, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-shell">
        <button className="modal-close" onClick={onClose} type="button" aria-label="إغلاق">×</button>
        <div className="modal-brand">🌿 أفق الاستدامة
</div>
        <h3>{title}</h3>
        <p>{subtitle}</p>
        {children}
      </div>
    </div>
  );
}