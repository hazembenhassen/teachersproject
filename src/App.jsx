import { useEffect, useState } from "react";

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
    title: "مجتمع للمعلمين",
    desc: "شارك أفكارك وتجاربك اليومية مع باقي المعلمين داخل مساحة واحدة.",
  },
  {
    icon: "🌿",
    title: "GreenCorner",
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

const accountTabs = [
  { id: "community", label: "Community" },
  { id: "green-corner", label: "GreenCorner" },
  { id: "dashboard", label: "لوحتي" },
];

const emptyLoginForm = {
  email: "",
  password: "",
};

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
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const payload = await response
    .json()
    .catch(() => ({ success: false, message: "تعذر قراءة استجابة الخادم." }));

  if (!response.ok) {
    throw new Error(payload.message || "حدث خطأ غير متوقع.");
  }

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
      if (!auth?.token) {
        setBooting(false);
        return;
      }

      try {
        const data = await apiRequest("/api/auth/me", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
        });

        if (!cancelled) {
          const session = { token: auth.token, teacher: data.teacher };
          setAuth(session);
          saveAuthSession(session);
        }
      } catch {
        if (!cancelled) {
          clearAuthSession();
          setAuth(null);
        }
      } finally {
        if (!cancelled) {
          setBooting(false);
        }
      }
    }

    verifySession();

    return () => {
      cancelled = true;
    };
  }, [auth?.token]);

  useEffect(() => {
    let cancelled = false;

    async function loadAccountData() {
      if (!auth?.token) {
        setPosts([]);
        setResources([]);
        return;
      }

      setAccountLoading(true);
      setAccountError("");

      try {
        const [postsResponse, resourcesResponse] = await Promise.all([
          apiRequest("/api/community/posts", {
            method: "GET",
            headers: {
              Authorization: `Bearer ${auth.token}`,
            },
          }),
          apiRequest("/api/green-corner/resources", {
            method: "GET",
            headers: {
              Authorization: `Bearer ${auth.token}`,
            },
          }),
        ]);

        if (!cancelled) {
          setPosts(postsResponse.posts);
          setResources(resourcesResponse.resources);
        }
      } catch (error) {
        if (!cancelled) {
          setAccountError(error.message);
        }
      } finally {
        if (!cancelled) {
          setAccountLoading(false);
        }
      }
    }

    loadAccountData();

    return () => {
      cancelled = true;
    };
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

  function updateLogin(field) {
    return (event) => {
      setLoginForm((current) => ({ ...current, [field]: event.target.value }));
    };
  }

  function updateSignup(field) {
    return (event) => {
      setSignupForm((current) => ({ ...current, [field]: event.target.value }));
    };
  }

  async function handleLogin(event) {
    event.preventDefault();
    setLoginState({ loading: true, error: "" });

    try {
      const data = await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(loginForm),
      });

      const session = {
        token: data.access_token,
        teacher: data.teacher,
      };

      saveAuthSession(session);
      setAuth(session);
      setActiveTab("community");
      setLoginForm(emptyLoginForm);
      closeModal();
    } catch (error) {
      setLoginState({ loading: false, error: error.message });
      return;
    }

    setLoginState({ loading: false, error: "" });
  }

  async function handleSignup(event) {
    event.preventDefault();
    setSignupState({ loading: true, error: "" });

    try {
      const data = await apiRequest("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          first_name: signupForm.firstName,
          last_name: signupForm.lastName,
          email: signupForm.email,
          subject: signupForm.subject,
          password: signupForm.password,
          confirm_password: signupForm.confirmPassword,
        }),
      });

      const session = {
        token: data.access_token,
        teacher: data.teacher,
      };

      saveAuthSession(session);
      setAuth(session);
      setActiveTab("community");
      setSignupForm(emptySignupForm);
      closeModal();
    } catch (error) {
      setSignupState({ loading: false, error: error.message });
      return;
    }

    setSignupState({ loading: false, error: "" });
  }

  async function handleLogout() {
    if (!auth?.token) {
      clearAuthSession();
      setAuth(null);
      return;
    }

    setLogoutLoading(true);

    try {
      await apiRequest("/api/auth/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });
    } catch {
      // Clear the client session even if the server is unavailable.
    } finally {
      clearAuthSession();
      setAuth(null);
      setPosts([]);
      setResources([]);
      setComposerText("");
      setActiveTab("community");
      setLogoutLoading(false);
    }
  }

  async function handleCreatePost(event) {
    event.preventDefault();
    setComposerLoading(true);
    setComposerError("");

    try {
      const response = await apiRequest("/api/community/posts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({
          content: composerText,
        }),
      });

      setPosts((current) => [response.post, ...current]);
      setComposerText("");
    } catch (error) {
      setComposerError(error.message);
    } finally {
      setComposerLoading(false);
    }
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
        />
      ) : (
        <LandingExperience onOpenLogin={() => openModal("login")} onOpenSignup={() => openModal("signup")} />
      )}

      {modal === "login" && (
        <AuthModal
          title="تسجيل الدخول"
          subtitle="أدخل بريدك الإلكتروني وكلمة المرور ثم ادخل إلى حسابك مباشرة."
          onClose={closeModal}
        >
          <form className="auth-form" onSubmit={handleLogin}>
            <label>
              البريد الإلكتروني
              <input
                type="email"
                value={loginForm.email}
                onChange={updateLogin("email")}
                placeholder="teacher@example.com"
                autoComplete="email"
              />
            </label>

            <label>
              كلمة المرور
              <input
                type="password"
                value={loginForm.password}
                onChange={updateLogin("password")}
                placeholder="Password1"
                autoComplete="current-password"
              />
            </label>

            {loginState.error && <p className="form-message error">{loginState.error}</p>}

            <button className="btn btn-primary btn-block" type="submit" disabled={loginState.loading}>
              {loginState.loading ? "جارٍ تسجيل الدخول..." : "تسجيل الدخول"}
            </button>

            <p className="switch-text">
              ليس لديك حساب؟{" "}
              <button type="button" className="switch-link" onClick={() => openModal("signup")}>
                أنشئ حسابًا
              </button>
            </p>
          </form>
        </AuthModal>
      )}

      {modal === "signup" && (
        <AuthModal
          title="إنشاء حساب"
          subtitle="أنشئ حساب معلم ثم ادخل مباشرة إلى المجتمع و GreenCorner."
          onClose={closeModal}
        >
          <form className="auth-form" onSubmit={handleSignup}>
            <div className="split-fields">
              <label>
                الاسم الأول
                <input
                  value={signupForm.firstName}
                  onChange={updateSignup("firstName")}
                  placeholder="محمد"
                  autoComplete="given-name"
                />
              </label>

              <label>
                اسم العائلة
                <input
                  value={signupForm.lastName}
                  onChange={updateSignup("lastName")}
                  placeholder="الأحمد"
                  autoComplete="family-name"
                />
              </label>
            </div>

            <label>
              البريد الإلكتروني
              <input
                type="email"
                value={signupForm.email}
                onChange={updateSignup("email")}
                placeholder="teacher@example.com"
                autoComplete="email"
              />
            </label>

            <label>
              المادة التي تدرّسها
              <select value={signupForm.subject} onChange={updateSignup("subject")}>
                <option value="">اختر المادة</option>
                {subjectOptions.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </label>

            <div className="split-fields">
              <label>
                كلمة المرور
                <input
                  type="password"
                  value={signupForm.password}
                  onChange={updateSignup("password")}
                  placeholder="Password1"
                  autoComplete="new-password"
                />
              </label>

              <label>
                تأكيد كلمة المرور
                <input
                  type="password"
                  value={signupForm.confirmPassword}
                  onChange={updateSignup("confirmPassword")}
                  placeholder="Password1"
                  autoComplete="new-password"
                />
              </label>
            </div>

            <p className="password-hint">كلمة المرور يجب أن تكون 8 أحرف على الأقل وتحتوي على حرف كبير ورقم.</p>

            {signupState.error && <p className="form-message error">{signupState.error}</p>}

            <button className="btn btn-primary btn-block" type="submit" disabled={signupState.loading}>
              {signupState.loading ? "جارٍ إنشاء الحساب..." : "إنشاء الحساب"}
            </button>

            <p className="switch-text">
              لديك حساب بالفعل؟{" "}
              <button type="button" className="switch-link" onClick={() => openModal("login")}>
                سجّل الدخول
              </button>
            </p>
          </form>
        </AuthModal>
      )}
    </>
  );
}

function LandingExperience({ onOpenLogin, onOpenSignup }) {
  return (
    <>
      <nav className="nav">
        <a className="brand" href="#top">
          <span className="brand-mark">🌿</span>
          <span className="brand-copy">
            نور<span>تعليم</span>
          </span>
        </a>

        <div className="nav-links">
          <a href="#features">المميزات</a>
          <a href="#why">لماذا المنصة</a>
          <a href="#access">الدخول للحساب</a>
        </div>

        <div className="nav-actions">
          <button className="btn btn-outline" onClick={onOpenLogin}>
            تسجيل الدخول
          </button>
          <button className="btn btn-primary" onClick={onOpenSignup}>
            إنشاء حساب
          </button>
        </div>
      </nav>

      <main id="top">
        <section className="hero hero-landing">
          <div className="hero-copy">
            <span className="eyebrow">حساب المعلم يبدأ من هنا</span>
            <h1>
              سجّل الدخول ثم ادخل إلى
              <span> مجتمعك وملفاتك التعليمية</span>
            </h1>
            <p>
              بعد تسجيل الدخول، يجد المعلم داخل حسابه ثلاثة أقسام واضحة في الشريط العلوي:
              Community للنشر والتفاعل، GreenCorner لملفات التحضير، ولوحة شخصية تجمع أهم
              المعلومات.
            </p>

            <div className="hero-actions">
              <button className="btn btn-primary btn-large" onClick={onOpenSignup}>
                ابدأ الآن
              </button>
              <button className="btn btn-ghost btn-large" onClick={onOpenLogin}>
                لدي حساب بالفعل
              </button>
            </div>
          </div>

          <div className="landing-preview">
            <div className="preview-card">
              <small>بعد الدخول</small>
              <strong>Community</strong>
              <p>انشر فكرة أو سؤالًا أو تجربة صفية مع المعلمين.</p>
            </div>
            <div className="preview-card">
              <small>بعد الدخول</small>
              <strong>GreenCorner</strong>
              <p>ملفات وأدوات جاهزة لمساعدتك في تحضير الدروس.</p>
            </div>
            <div className="preview-card">
              <small>بعد الدخول</small>
              <strong>لوحتي</strong>
              <p>ملخص سريع لحسابك ونشاطك داخل المنصة.</p>
            </div>
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
            <p>
              بدل البقاء في الصفحة الرئيسية، يتحول المعلم بعد المصادقة إلى مساحة خاصة به
              فيها تنقل علوي ومحتوى مرتبط بحسابه.
            </p>
          </div>
        </section>
      </main>

      <footer className="footer" id="access">
        <strong>نور تعليم</strong>
        <p>سجّل الدخول الآن لتجربة الحساب الجديد المخصص للمعلمين.</p>
      </footer>
    </>
  );
}

function AccountExperience({
  teacher,
  activeTab,
  onChangeTab,
  onLogout,
  logoutLoading,
  posts,
  resources,
  accountLoading,
  accountError,
  composerText,
  setComposerText,
  onCreatePost,
  composerLoading,
  composerError,
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
            <button
              key={tab.id}
              type="button"
              className={`account-tab ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => onChangeTab(tab.id)}
            >
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
            <p>
              استخدم الشريط العلوي للتنقل بين المجتمع، GreenCorner، ولوحتك الشخصية.
            </p>
          </div>
          <div className="mini-stat-grid">
            <div className="mini-stat">
              <strong>{posts.length}</strong>
              <span>منشورات المجتمع</span>
            </div>
            <div className="mini-stat">
              <strong>{resources.length}</strong>
              <span>ملفات GreenCorner</span>
            </div>
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
              <textarea
                value={composerText}
                onChange={(event) => setComposerText(event.target.value)}
                placeholder="اكتب هنا شيئًا تريد مشاركته مع المعلمين..."
              />
              {composerError && <p className="form-message error">{composerError}</p>}
              <div className="composer-actions">
                <span>كل منشور يظهر مباشرة داخل المجتمع.</span>
                <button className="btn btn-primary" type="submit" disabled={composerLoading}>
                  {composerLoading ? "جارٍ النشر..." : "نشر"}
                </button>
              </div>
            </form>

            <div className="post-list">
              {posts.length === 0 ? (
                <div className="empty-card">
                  <strong>لا توجد منشورات بعد</strong>
                  <span>كن أول معلم يشارك فكرة أو سؤالًا داخل المجتمع.</span>
                </div>
              ) : (
                posts.map((post) => (
                  <article className="post-card" key={post.id}>
                    <div className="post-head">
                      <div className="post-avatar">{getInitials(post.author) || "م"}</div>
                      <div>
                        <strong>{fullName(post.author)}</strong>
                        <span>{new Date(post.created_at).toLocaleString("ar-EG")}</span>
                      </div>
                    </div>
                    <p>{post.content}</p>
                  </article>
                ))
              )}
            </div>
          </section>
        )}

        {activeTab === "green-corner" && (
          <section className="account-section">
            <div className="section-heading account-heading">
              <span className="section-tag">GreenCorner</span>
              <h2>ملفات مفيدة لتحضير الدروس</h2>
              <p>
                هذه الزاوية مخصصة للمعلم الذي يريد ملفات جاهزة وأدوات تنظيمية تساعده قبل
                الحصة.
              </p>
            </div>

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
                    <button className="btn btn-ghost" type="button">
                      {resource.file_name}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

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
                  <li>
                    <span>الاسم</span>
                    <strong>{fullName(teacher)}</strong>
                  </li>
                  <li>
                    <span>البريد الإلكتروني</span>
                    <strong>{teacher.email}</strong>
                  </li>
                  <li>
                    <span>المادة</span>
                    <strong>{teacher.subject || "غير محددة"}</strong>
                  </li>
                </ul>
              </article>

              <article className="dashboard-card">
                <h3>ملخص النشاط</h3>
                <ul className="detail-list">
                  <li>
                    <span>عدد المنشورات</span>
                    <strong>{posts.length}</strong>
                  </li>
                  <li>
                    <span>عدد الملفات المتاحة</span>
                    <strong>{resources.length}</strong>
                  </li>
                  <li>
                    <span>أول قسم موصى به</span>
                    <strong>Community</strong>
                  </li>
                </ul>
              </article>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function AuthModal({ title, subtitle, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="modal-shell">
        <button className="modal-close" onClick={onClose} type="button" aria-label="إغلاق">
          ×
        </button>
        <div className="modal-brand">🌿 نور تعليم</div>
        <h3>{title}</h3>
        <p>{subtitle}</p>
        {children}
      </div>
    </div>
  );
}
