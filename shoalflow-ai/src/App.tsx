import { useEffect, useMemo, useState } from 'react';
import { api, auth } from '@appdeploy/client';
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  Bot,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  FilePlus2,
  FileText,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  Wallet,
  X,
} from 'lucide-react';

type RecordItem = {
  id: string;
  kind: string;
  name: string;
  detail?: string;
  amount?: number;
  status?: string;
  createdAt?: string;
  ownerId?: string;
};
const menu = [
  { key: 'dashboard', label: 'Overview', Icon: LayoutDashboard },
  { key: 'customers', label: 'Customers', Icon: Users },
  { key: 'quotes', label: 'Quotations', Icon: FileText },
  { key: 'invoices', label: 'Invoices', Icon: Wallet },
  { key: 'followups', label: 'Follow-ups', Icon: MessageCircle },
  { key: 'insights', label: 'Analytics', Icon: BarChart3 },
];
const money = (n: number) =>
  'KSh ' + new Intl.NumberFormat('en-KE').format(n || 0);
function App() {
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(
    null
  );
  const [page, setPage] = useState('home');
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [form, setForm] = useState({
    name: '',
    detail: '',
    amount: '',
    status: 'Draft',
  });
  const [draft, setDraft] = useState('');
  const [showAI, setShowAI] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const collection = ['customers', 'quotes', 'invoices', 'followups'].includes(
    page
  )
    ? page
    : 'customers';
  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/api/records');
      setRecords(r.data.items || []);
      setMessage('');
    } catch (e) {
      setMessage('Could not load business records. Please retry.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    auth
      .getUser()
      .then(u => {
        if (u) {
          setUser(u);
          setPage('dashboard');
          load();
        }
      })
      .catch(() => {});
  }, []);
  const signin = async () => {
    try {
      const r = await auth.signIn();
      setUser(r.user);
      setPage('dashboard');
      await load();
    } catch (e) {
      setMessage(
        'Sign-in was cancelled or blocked. Allow popups and try again.'
      );
    }
  };
  const signout = async () => {
    await auth.signOut();
    setUser(null);
    setRecords([]);
    setPage('home');
  };
  const openModal = (item?: RecordItem) => {
    setEditing(item?.id || null);
    setForm({
      name: item?.name || '',
      detail: item?.detail || '',
      amount: String(item?.amount || ''),
      status: item?.status || 'Draft',
    });
    setModal(true);
  };
  const save = async () => {
    if (!form.name.trim()) {
      setMessage('A name or title is required.');
      return;
    }
    setBusy(true);
    try {
      const payload = {
        kind: collection,
        name: form.name.trim(),
        detail: form.detail.trim(),
        amount: Number(form.amount) || 0,
        status: form.status,
      };
      if (editing) await api.put('/api/records/' + editing, payload);
      else await api.post('/api/records', payload);
      setModal(false);
      setMessage('Saved successfully.');
      await load();
    } catch {
      setMessage('Save failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };
  const remove = async (id: string) => {
    if (!window.confirm('Delete this record permanently?')) return;
    try {
      await api.delete('/api/records/' + id);
      await load();
      setMessage('Record deleted.');
    } catch {
      setMessage('Could not delete record.');
    }
  };
  const generate = async () => {
    if (!prompt.trim()) {
      setMessage('Describe what you need AI to draft.');
      return;
    }
    setAiBusy(true);
    setDraft('');
    try {
      const r = await api.post('/api/draft', {
        kind: page,
        prompt: prompt.trim(),
      });
      setDraft(r.data.text || 'No draft returned.');
    } catch {
      setMessage('AI drafting is currently unavailable. Please retry.');
    } finally {
      setAiBusy(false);
    }
  };
  const visible = useMemo(
    () =>
      records.filter(
        r =>
          r.kind === collection &&
          (r.name + ' ' + (r.detail || ''))
            .toLowerCase()
            .includes(query.toLowerCase())
      ),
    [records, collection, query]
  );
  const invoices = records.filter(x => x.kind === 'invoices');
  const total = invoices
    .filter(x => x.status === 'Paid')
    .reduce((a, b) => a + (b.amount || 0), 0);
  const due = invoices
    .filter(x => x.status !== 'Paid')
    .reduce((a, b) => a + (b.amount || 0), 0);
  return (
    <div className="app-shell">
      {!user || page === 'home' ? (
        <div className="public">
          <header className="site-nav">
            <a href="#home" className="brand">
              <span className="mark">
                <Sparkles size={19} />
              </span>{' '}
              Shoal<span>Flow</span>
              <small>AI</small>
            </a>
            <nav className="desktop-links">
              <a href="#features">Solutions</a>
              <a href="#how">How it works</a>
              <a href="#pricing">Pricing</a>
            </nav>
            <button
              className="btn btn-dark"
              onClick={user ? () => setPage('dashboard') : signin}
            >
              {user ? 'Open workspace' : 'Get started'}{' '}
              <ArrowUpRight size={16} />
            </button>
          </header>
          <section id="home" className="hero">
            <div className="hero-copy">
              <span className="eyebrow">
                <span className="green-dot" /> YOUR GROWTH STARTS HERE
              </span>
              <h1>
                Turn every lead.
                <br />
                <em>Into an opportunity.</em>
              </h1>
              <p>
                Your next customer deserves a great experience. Organize every inquiry, create professional quotations and keep business moving with an AI-powered workspace built for growing teams.
              </p>
              <div className="hero-actions">
                <button
                  onClick={user ? () => setPage('dashboard') : signin}
                  className="btn btn-lime"
                >
                  Start your workspace <ArrowRight size={18} />
                </button>
                <a href="#features" className="btn btn-outline">
                  Explore features <ChevronRight size={17} />
                </a>
              </div>
              <div className="hero-proof">
                <span className="mini-check">
                  <Check size={14} />
                </span>{' '}
                Organize your sales pipeline{' '}
                <span className="mini-check">
                  <Check size={14} />
                </span>{' '}
                AI-assisted drafting
              </div>
            </div>
            <div className="hero-visual">
              <div className="floating-pill pill-top">
                <span className="dot-blue" /> All your operations. One place.
              </div>
              <div className="preview">
                <div className="preview-header">
                  <div className="preview-logo">
                    <Sparkles size={15} /> ShoalFlow
                  </div>
                  <span className="preview-live">● Sample interface</span>
                </div>
                <div className="preview-title">
                  Good morning, founder <span>✳</span>
                </div>
                <div className="preview-sub">
                  Here’s your business at a glance
                </div>
                <div className="preview-stats">
                  <div>
                    <small>Customer records</small>
                    <strong>128</strong>
                    <span>Organized & searchable</span>
                  </div>
                  <div>
                    <small>Open quotations</small>
                    <strong>24</strong>
                    <span>Ready to follow up</span>
                  </div>
                </div>
                <div className="preview-chart">
                  <div className="chart-head">
                    <strong>Business momentum</strong>
                    <span>This month ▾</span>
                  </div>
                  <div className="bars">
                    {[30, 52, 40, 63, 46, 78, 58, 85, 69, 91, 73, 100].map(
                      (v, i) => (
                        <i key={i} style={{ height: v + '%' }} />
                      )
                    )}
                  </div>
                  <div className="bar-labels">
                    <span>WEEK 1</span>
                    <span>WEEK 2</span>
                    <span>WEEK 3</span>
                    <span>WEEK 4</span>
                  </div>
                </div>
                <div className="preview-footer">
                  <span className="ai-icon">
                    <Bot size={19} />
                  </span>
                  <div>
                    <strong>Meet your AI sales assistant</strong>
                    <small>Draft quotes and follow-ups in seconds</small>
                  </div>
                  <ArrowUpRight size={18} />
                </div>
              </div>
              <div className="floating-pill pill-bottom">
                <CheckCircle2 size={17} /> Built for growing teams
              </div>
            </div>
          </section>
          <div className="trust-strip">
            <span>ONE SMARTER WORKSPACE FOR</span>
            <strong>CREATIVE STUDIOS</strong>
            <strong>SERVICE COMPANIES</strong>
            <strong>GROWING TEAMS</strong>
            <strong>LOCAL BUSINESSES</strong>
          </div>
<section className="platform-overview" id="platform">
            <div>
              <span className="eyebrow">PLATFORM OVERVIEW</span>
              <h2>Everything your team needs to <em>move forward.</em></h2>
              <p>New inquiries, pending quotes and customer follow-ups should not live in disconnected notes. Bring the work together in one organized command centre.</p>
              <div className="platform-bullets">
                <div><Check size={17}/> Keep customer history in one place</div>
                <div><Check size={17}/> See every quote and invoice status</div>
                <div><Check size={17}/> Draft faster with a built-in AI assistant</div>
              </div>
              <button className="btn btn-dark" onClick={user ? () => setPage('dashboard') : signin}>Open your workspace <ArrowRight size={18}/></button>
            </div>
            <div className="platform-showcase">
              <div className="showcase-window">
                <div className="showcase-label">Your sales pipeline <span>Illustrative workflow</span></div>
                <div className="showcase-row"><i><Users size={17}/></i><div><strong>New customer inquiry</strong><small>Capture requirements and details</small></div><b>NEW</b></div>
                <div className="showcase-row"><i><FileText size={17}/></i><div><strong>Quotation prepared</strong><small>Review and approve your pricing</small></div><b>DRAFT</b></div>
                <div className="showcase-row"><i><MessageCircle size={17}/></i><div><strong>Follow-up planned</strong><small>Keep the conversation moving</small></div><b>NEXT</b></div>
                <div className="showcase-row"><i><Wallet size={17}/></i><div><strong>Invoice recorded</strong><small>Track manual payment status</small></div><b>TRACK</b></div>
              </div>
            </div>
          </section>
          <section id="features" className="section">
            <div className="section-heading">
              <span className="eyebrow">EVERYTHING CONNECTED</span>
              <h2>
                Run your business.
                <br />
                <em>Not your spreadsheets.</em>
              </h2>
              <p>
                One clean platform for the everyday work that keeps your
                business moving.
              </p>
            </div>
            <div className="features">
              {[
                {
                  Icon: Users,
                  title: 'Customer management',
                  desc: 'Keep your contacts, notes and customer history together.',
                },
                {
                  Icon: FileText,
                  title: 'Smart quotations',
                  desc: 'Prepare professional quotes and speed up approvals.',
                },
                {
                  Icon: Wallet,
                  title: 'Invoice tracking',
                  desc: 'Keep a clear view of what has been billed and paid.',
                },
                {
                  Icon: MessageCircle,
                  title: 'Follow-up assistant',
                  desc: 'Never lose sight of the next customer conversation.',
                },
                {
                  Icon: Bot,
                  title: 'AI drafting',
                  desc: 'Create clearer quotation and follow-up language.',
                },
                {
                  Icon: BarChart3,
                  title: 'Business insights',
                  desc: 'Know what is moving, pending and generating revenue.',
                },
              ].map((f, i) => (
                <article className="feature" key={i}>
                  <div className="feature-icon">
                    <f.Icon size={23} />
                  </div>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                  <span className="feature-arrow">
                    <ArrowUpRight size={17} />
                  </span>
                </article>
              ))}
            </div>
          </section>
          <section id="how" className="how">
            <div>
              <span className="eyebrow">MADE FOR THE WAY YOU WORK</span>
              <h2>
                From inquiry
                <br />
                to <em>income.</em>
              </h2>
              <p>
                Stop switching between chats, documents, notebooks and
                spreadsheets. Keep every step connected and visible.
              </p>
              <button
                className="btn btn-lime"
                onClick={user ? () => setPage('dashboard') : signin}
              >
                Explore your workspace <ArrowRight size={17} />
              </button>
            </div>
            <div className="steps">
              {[
                [
                  '01',
                  'Capture the inquiry',
                  'Add a new customer and their requirements.',
                ],
                [
                  '02',
                  'Draft a professional quote',
                  'Use AI to help you write, then review the final details.',
                ],
                [
                  '03',
                  'Follow up with confidence',
                  'Track next steps and keep conversations moving.',
                ],
                [
                  '04',
                  'Monitor your growth',
                  'See recorded invoices and business performance.',
                ],
              ].map(s => (
                <div className="step" key={s[0]}>
                  <b>{s[0]}</b>
                  <div>
                    <strong>{s[1]}</strong>
                    <span>{s[2]}</span>
                  </div>
                  <ArrowUpRight size={19} />
                </div>
              ))}
            </div>
          </section>
<section className="integration-story">
            <div className="communication-mock">
              <div className="communication-header"><MessageCircle size={22}/> Customer communication <span>Message draft preview</span></div>
              <div className="mock-message">Hello! Could you send a quotation for branded company mugs?</div>
              <div className="mock-message right">Thank you for reaching out. We'd be happy to prepare a quote. Could you confirm the quantity and preferred delivery date?</div>
              <div className="mock-note"><ShieldCheck size={15}/> AI suggests wording. You review and send it yourself.</div>
            </div>
            <div>
              <span className="eyebrow">STAY CONNECTED</span>
              <h2>Conversations that become <em>opportunities.</em></h2>
              <p>Turn incoming requests into organized follow-ups and polished replies. ShoalFlow's AI assistant helps write the message while you stay in control of what gets sent.</p>
              <p>Direct WhatsApp messaging and payment-provider connections are future integrations—not active in this version.</p>
              <button className="btn btn-outline" onClick={user ? () => setPage('dashboard') : signin}>Try the drafting assistant <ArrowRight size={17}/></button>
            </div>
          </section>
          <section id="pricing" className="section price-section">
            <div className="section-heading">
              <span className="eyebrow">SIMPLE PLANS</span>
              <h2>
                Built to start small.
                <br />
                <em>Designed to scale.</em>
              </h2>
              <p>
                Illustrative early-access pricing. Billing is not active in this
                preview.
              </p>
            </div>
            <div className="price-grid">
              {[
                ['Starter', '3,000', 'Your customer and quote essentials'],
                [
                  'Growth',
                  '8,000',
                  'More operational visibility, AI drafting and follow-ups',
                ],
                [
                  'Business',
                  '20,000+',
                  'For teams with more advanced workflows',
                ],
              ].map((p, i) => (
                <div
                  className={'price-card ' + (i === 1 ? 'highlight' : '')}
                  key={p[0]}
                >
                  <span>{p[0]}</span>
                  <div className="price">
                    <strong>KSh {p[1]}</strong>
                    <small>/ month</small>
                  </div>
                  <p>{p[2]}</p>
                  <div className="price-line" />
                  <div>
                    <Check size={16} /> Customer records
                  </div>
                  <div>
                    <Check size={16} /> Quotations & invoices
                  </div>
                  <div>
                    <Check size={16} /> Business dashboard
                  </div>
                  <button
                    className={'btn ' + (i === 1 ? 'btn-lime' : 'btn-outline')}
                    onClick={user ? () => setPage('dashboard') : signin}
                  >
                    Get started <ArrowRight size={16} />
                  </button>
                </div>
              ))}
            </div>
          </section>
<section className="closing-cta">
            <span className="eyebrow">READY TO BUILD MOMENTUM?</span>
            <h2>Give your next big business idea a smarter place to grow.</h2>
            <p>Get organized with customers, quotations, invoices and useful AI drafts in one workspace.</p>
            <button className="btn btn-lime" onClick={user ? () => setPage('dashboard') : signin}>Open ShoalFlow AI <ArrowRight size={18}/></button>
          </section>
          <footer className="footer">
            <div>
              <a className="brand" href="#home">
                <span className="mark">
                  <Sparkles size={18} />
                </span>{' '}
                Shoal<span>Flow</span>
                <small>AI</small>
              </a>
              <p>
                Smarter operations. Stronger businesses.
                <br />
                Built with ambition in Kenya.
              </p>
            </div>
            <span>© 2026 ShoalFlow AI · Early-access MVP</span>
          </footer>
        </div>
      ) : (
        <div className="workspace">
          <aside className={'sidebar ' + (mobile ? 'mobile-open' : '')}>
            <div className="sidebar-top">
              <div className="brand">
                <span className="mark">
                  <Sparkles size={18} />
                </span>{' '}
                Shoal<span>Flow</span>
                <small>AI</small>
              </div>
              <button className="mobile-close" onClick={() => setMobile(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="side-caption">WORKSPACE</div>
            <div className="side-items">
              {menu.map(m => (
                <button
                  key={m.key}
                  className={'side-item ' + (page === m.key ? 'selected' : '')}
                  onClick={() => {
                    setPage(m.key);
                    setQuery('');
                    setMobile(false);
                    setMessage('');
                  }}
                >
                  <m.Icon size={18} />
                  {m.label}
                  {page === m.key && <span className="side-active" />}
                </button>
              ))}
            </div>
            <div className="sidebar-bottom">
              <div className="help-card">
                <span className="sparkle-circ">
                  <Sparkles size={19} />
                </span>
                <strong>Your smarter business starts here</strong>
                <p>Keep customers, quotes and follow-ups in sync.</p>
              </div>
              <button className="side-item" onClick={() => setPage('home')}>
                <Home size={18} /> Visit website
              </button>
              <button className="side-item" onClick={signout}>
                <LogOut size={18} /> Sign out
              </button>
              <div className="user-mini">
                <span>{(user.name || user.email || 'U')[0].toUpperCase()}</span>
                <div>
                  <strong>{user.name || 'Business owner'}</strong>
                  <small>{user.email || 'Workspace account'}</small>
                </div>
              </div>
            </div>
          </aside>
          <div className="main-app">
            <header className="app-header">
              <div className="header-left">
                <button
                  className="mobile-toggle"
                  onClick={() => setMobile(true)}
                >
                  <Menu size={23} />
                </button>
                <span className="breadcrumb">
                  Workspace <ChevronRight size={14} />{' '}
                  <strong>
                    {menu.find(m => m.key === page)?.label || 'Overview'}
                  </strong>
                </span>
              </div>
              <div className="header-right">
                <span className="secure-label">
                  <ShieldCheck size={15} /> Private workspace
                </span>
                <div className="avatar">
                  {(user.name || user.email || 'U')[0].toUpperCase()}
                </div>
              </div>
            </header>
            <div className="main-body">
              {message && (
                <div className="notice" role="status">
                  {message}
                  <button onClick={() => setMessage('')}>
                    <X size={15} />
                  </button>
                </div>
              )}
              {page === 'dashboard' ? (
                <>
                  <div className="app-page-title">
                    <div>
                      <div className="mini-label">YOUR WORKSPACE</div>
                      <h1>
                        Welcome back
                        {user.name ? ', ' + user.name.split(' ')[0] : ''}{' '}
                        <span>✳</span>
                      </h1>
                      <p>Here's what's happening with your business today.</p>
                    </div>
                    <button
                      className="btn btn-dark"
                      onClick={() => {
                        setPage('quotes');
                        openModal();
                      }}
                    >
                      <Plus size={17} /> New quotation
                    </button>
                  </div>
                  <div className="metrics">
                    <div className="metric">
                      <div>
                        <span>Total customers</span>
                        <Users size={18} />
                      </div>
                      <strong>
                        {records.filter(r => r.kind === 'customers').length}
                      </strong>
                      <small>In your workspace</small>
                    </div>
                    <div className="metric">
                      <div>
                        <span>Active quotations</span>
                        <FileText size={18} />
                      </div>
                      <strong>
                        {records.filter(r => r.kind === 'quotes').length}
                      </strong>
                      <small>Quotes created</small>
                    </div>
                    <div className="metric">
                      <div>
                        <span>Recorded paid invoices</span>
                        <CircleDollarSign size={18} />
                      </div>
                      <strong className="sm-value">{money(total)}</strong>
                      <small>Marked as paid</small>
                    </div>
                    <div className="metric">
                      <div>
                        <span>Outstanding invoices</span>
                        <Wallet size={18} />
                      </div>
                      <strong className="sm-value">{money(due)}</strong>
                      <small>Not marked paid</small>
                    </div>
                  </div>
                  <div className="dashboard-grid">
                    <div className="panel">
                      <div className="panel-header">
                        <div>
                          <h3>Recent activity</h3>
                          <p>Your latest customer and business records</p>
                        </div>
                      </div>
                      {records.length ? (
                        <div className="activity-list">
                          {records
                            .slice()
                            .sort((a, b) =>
                              (b.createdAt || '').localeCompare(
                                a.createdAt || ''
                              )
                            )
                            .slice(0, 6)
                            .map(r => (
                              <div className="activity" key={r.id}>
                                <div className="activity-icon">
                                  <ClipboardList size={17} />
                                </div>
                                <div>
                                  <strong>{r.name}</strong>
                                  <small>
                                    {r.kind.replace(/s$/, '')} ·{' '}
                                    {r.status || 'Saved'}
                                  </small>
                                </div>
                                <span>{r.amount ? money(r.amount) : '—'}</span>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <div className="empty-panel">
                          <FilePlus2 size={27} />
                          <strong>Start with your first record</strong>
                          <p>
                            Add customers or quotations to see your activity
                            here.
                          </p>
                          <button
                            onClick={() => {
                              setPage('customers');
                              openModal();
                            }}
                            className="btn btn-outline"
                          >
                            Add customer
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="panel assistant-panel">
                      <div className="assistant-symbol">
                        <Sparkles size={23} />
                      </div>
                      <span className="mini-label">YOUR AI CO-PILOT</span>
                      <h3>
                        Work smarter,
                        <br />
                        every single day.
                      </h3>
                      <p>
                        Need a polished quote introduction or customer
                        follow-up? Let AI help with the wording.
                      </p>
                      <button
                        className="btn btn-lime"
                        onClick={() => {
                          setShowAI(true);
                          setPrompt(
                            'Write a friendly follow-up message for a customer who has not responded to a quotation.'
                          );
                        }}
                      >
                        Try AI assistant <ArrowRight size={17} />
                      </button>
                    </div>
                  </div>
                  <div className="quick-links">
                    <button
                      onClick={() => {
                        setPage('customers');
                        openModal();
                      }}
                    >
                      <Users size={18} /> Add customer{' '}
                      <ArrowUpRight size={18} />
                    </button>
                    <button
                      onClick={() => {
                        setPage('invoices');
                        openModal();
                      }}
                    >
                      <Wallet size={18} /> New invoice{' '}
                      <ArrowUpRight size={18} />
                    </button>
                    <button
                      onClick={() => {
                        setPage('followups');
                        openModal();
                      }}
                    >
                      <Bell size={18} /> Plan follow-up{' '}
                      <ArrowUpRight size={18} />
                    </button>
                  </div>
                </>
              ) : page === 'insights' ? (
                <>
                  <div className="app-page-title">
                    <div>
                      <div className="mini-label">BUSINESS INTELLIGENCE</div>
                      <h1>Your numbers, clearly.</h1>
                      <p>Live totals from records in your workspace.</p>
                    </div>
                  </div>
                  <div className="metrics">
                    <div className="metric">
                      <span>Customers</span>
                      <strong>
                        {records.filter(r => r.kind === 'customers').length}
                      </strong>
                    </div>
                    <div className="metric">
                      <span>Quotations</span>
                      <strong>
                        {records.filter(r => r.kind === 'quotes').length}
                      </strong>
                    </div>
                    <div className="metric">
                      <span>Paid invoices</span>
                      <strong>{money(total)}</strong>
                    </div>
                    <div className="metric">
                      <span>Unpaid invoices</span>
                      <strong>{money(due)}</strong>
                    </div>
                  </div>
                  <div className="panel insight-panel">
                    <BarChart3 size={35} />
                    <h3>Every decision starts with good records</h3>
                    <p>
                      As you add customers, quotations, invoices and follow-ups,
                      this dashboard updates automatically. Figures are based on
                      your own records rather than bank or payment-provider
                      verification.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="app-page-title">
                    <div>
                      <div className="mini-label">MANAGE YOUR BUSINESS</div>
                      <h1>{menu.find(m => m.key === page)?.label}</h1>
                      <p>
                        {page === 'customers'
                          ? 'Build relationships that last.'
                          : page === 'quotes'
                            ? 'Manage requests and prepare winning quotes.'
                            : page === 'invoices'
                              ? 'Track billing and recorded payment status.'
                              : 'Stay on top of important customer conversations.'}
                      </p>
                    </div>
                    <div className="title-actions">
                      <button
                        className="btn btn-outline"
                        onClick={() => {
                          setShowAI(true);
                          setPrompt('');
                        }}
                      >
                        <Sparkles size={17} /> AI draft
                      </button>
                      <button
                        className="btn btn-dark"
                        onClick={() => openModal()}
                      >
                        <Plus size={17} /> Add{' '}
                        {page === 'customers'
                          ? 'customer'
                          : page === 'quotes'
                            ? 'quotation'
                            : page === 'invoices'
                              ? 'invoice'
                              : 'follow-up'}
                      </button>
                    </div>
                  </div>
                  <div className="panel records-panel">
                    <div className="records-bar">
                      <div className="record-count">
                        {visible.length} {page} in your workspace
                      </div>
                      <div className="search">
                        <Search size={18} />
                        <input
                          value={query}
                          onChange={e => setQuery(e.target.value)}
                          placeholder="Search records..."
                          aria-label="Search records"
                        />
                      </div>
                    </div>
                    {loading ? (
                      <div className="empty-panel">Loading records...</div>
                    ) : visible.length ? (
                      <div className="table-wrap">
                        <table>
                          <thead>
                            <tr>
                              <th>Name / Title</th>
                              <th>Details</th>
                              <th>
                                {page === 'customers' ? 'Type' : 'Amount'}
                              </th>
                              <th>Status</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {visible.map(r => (
                              <tr key={r.id}>
                                <td>
                                  <strong>{r.name}</strong>
                                </td>
                                <td>{r.detail || '—'}</td>
                                <td>
                                  {page === 'customers'
                                    ? 'Customer'
                                    : money(r.amount || 0)}
                                </td>
                                <td>
                                  <span
                                    className={
                                      'status ' +
                                      (r.status === 'Paid' ? 'paid' : '')
                                    }
                                  >
                                    {r.status || 'Draft'}
                                  </span>
                                </td>
                                <td>
                                  <button
                                    className="small-action"
                                    onClick={() => openModal(r)}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    aria-label={'Delete ' + r.name}
                                    className="small-action danger"
                                    onClick={() => remove(r.id)}
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="empty-panel">
                        <BriefcaseBusiness size={31} />
                        <h3>No {page} yet</h3>
                        <p>
                          Add your first record and it will appear here. All
                          data is private to your account.
                        </p>
                        <button
                          className="btn btn-dark"
                          onClick={() => openModal()}
                        >
                          <Plus size={17} /> Add first record
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {modal && (
        <div
          className="overlay"
          onMouseDown={e => {
            if (e.target === e.currentTarget) setModal(false);
          }}
        >
          <div className="dialog">
            <div className="dialog-head">
              <div>
                <span className="mini-label">BUSINESS RECORD</span>
                <h2>
                  {editing ? 'Edit' : 'New'} {collection.replace(/s$/, '')}
                </h2>
              </div>
              <button onClick={() => setModal(false)}>
                <X size={20} />
              </button>
            </div>
            <label>
              Name or title *
              <input
                value={form.name}
                maxLength={120}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder={
                  collection === 'customers'
                    ? 'Customer or company name'
                    : 'Record title'
                }
              />
            </label>
            <label>
              Notes / details
              <textarea
                value={form.detail}
                maxLength={1500}
                onChange={e => setForm({ ...form, detail: e.target.value })}
                placeholder="Contact details, requirements, next steps..."
                rows={4}
              />
            </label>
            {collection !== 'customers' && (
              <label>
                Amount (KSh)
                <input
                  type="number"
                  min="0"
                  value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })}
                  placeholder="0"
                />
              </label>
            )}
            <label>
              Status
              <select
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}
              >
                {(collection === 'invoices'
                  ? ['Draft', 'Sent', 'Paid', 'Overdue']
                  : collection === 'quotes'
                    ? ['Draft', 'Sent', 'Accepted', 'Declined']
                    : collection === 'followups'
                      ? ['Draft', 'Pending', 'Completed']
                      : ['Draft', 'Active', 'Inactive']
                ).map(s => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <div className="dialog-actions">
              <button
                className="btn btn-outline"
                onClick={() => setModal(false)}
              >
                Cancel
              </button>
              <button className="btn btn-dark" disabled={busy} onClick={save}>
                {busy ? 'Saving...' : 'Save record'} <Check size={17} />
              </button>
            </div>
          </div>
        </div>
      )}
      {showAI && (
        <div
          className="overlay"
          onMouseDown={e => {
            if (e.target === e.currentTarget) setShowAI(false);
          }}
        >
          <div className="dialog ai-dialog">
            <div className="dialog-head">
              <div>
                <span className="mini-label">SHOALFLOW AI</span>
                <h2>
                  <Sparkles size={22} /> AI drafting assistant
                </h2>
              </div>
              <button onClick={() => setShowAI(false)}>
                <X size={20} />
              </button>
            </div>
            <p>
              Describe the quotation introduction or follow-up you want drafted.
              Review everything before using it; do not include confidential
              customer details.
            </p>
            <label>
              Your instructions
              <textarea
                value={prompt}
                rows={4}
                maxLength={1200}
                onChange={e => setPrompt(e.target.value)}
                placeholder="Write a professional follow-up about a printing quotation..."
              />
            </label>
            <button
              className="btn btn-dark"
              disabled={aiBusy}
              onClick={generate}
            >
              {aiBusy ? 'Drafting...' : 'Generate draft'} <Sparkles size={16} />
            </button>
            {draft && (
              <div className="ai-result">
                <div>
                  <strong>Editable suggestion</strong>
                  <button onClick={() => navigator.clipboard.writeText(draft)}>
                    Copy text
                  </button>
                </div>
                <textarea
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  rows={9}
                />
                <small>
                  AI-generated wording may contain mistakes. Verify all
                  information before sending.
                </small>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
export default App;
