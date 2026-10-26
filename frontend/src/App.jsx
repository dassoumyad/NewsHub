import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { ArrowDown, ArrowRight, Bookmark, Check, ChevronRight, Clock3, Crown, Menu, Search, Sparkles, X } from "lucide-react";
import api, { imageUrl } from "./api/axios";
import NewsImage from "./NewsImage";
import Article from "./Article";
import Auth from "./Auth";
import SavedStories from "./SavedStories";
import Premium from "./Premium";
import Admin from "./Admin";
import AdminAuth from "./AdminAuth";
import ProfileDropdown from "./ProfileDropdown";
import AdminRoute from "./AdminRoute";
import "./App.css";
import "./Article.css";
import "./Auth.css";
import "./SavedStories.css";
import "./Admin.css";
import "./AdminAuth.css";
import "./theme.css";

const formatDate = (date) => date ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(date)) : "Latest";
const formatToday = () => new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(new Date()).toUpperCase();
const readTime = (text = "") => `${Math.max(3, Math.ceil(text.trim().split(/\s+/).length / 220))} min read`;

function Header({ categories, user, onSearch }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return <>
    <div className="topline"><div className="shell topline-inner"><span>{formatToday()}</span><span className="topline-note"><Sparkles size={13} /> Independent journalism, for a clearer view.</span><Link to="/premium">Become a member <ArrowRight size={13} /></Link></div></div>
    <header className="site-header"><div className="shell header-inner">
      <button className="icon-button mobile-menu" aria-label="Open menu" onClick={() => setMobileOpen(!mobileOpen)}>{mobileOpen ? <X /> : <Menu />}</button>
      <Link to="/" className="wordmark">news<span>hub</span><i>.</i></Link>
      <nav className={`main-nav ${mobileOpen ? "nav-open" : ""}`}><Link to="/" onClick={() => setMobileOpen(false)}>Today</Link>{categories.slice(0, 4).map(c => <a key={c.name} href={`/#${encodeURIComponent(c.name)}`} onClick={() => setMobileOpen(false)}>{c.name}</a>)}<Link to="/premium" className="nav-premium"><Crown size={14} /> Premium</Link></nav>
      <div className="header-actions"><button className="icon-button search-toggle" aria-label="Search stories" onClick={onSearch}><Search size={19} /></button>{user ? <ProfileDropdown user={user} /> : <Link className="sign-in-link" to="/login">Sign in</Link>}<Link to="/premium" className="subscribe-button">Subscribe <ArrowRight size={15} /></Link></div>
    </div></header>
  </>;
}

function StoryCard({ story, featured = false, saved, toggleSave, index = 0 }) {
  return <article className={`story-card ${featured ? "story-featured" : ""}`} style={{ "--stagger": `${index * 65}ms` }}>
    <Link className="story-image-link" to={`/article/${story._id}`}><NewsImage className="story-image" src={imageUrl(story.image)} alt="" loading={featured ? "eager" : "lazy"} /><span className="image-scrim" />{story.isPremium && <span className="premium-pill"><Crown size={12} /> Member story</span>}</Link>
    <div className="story-copy"><div className="story-meta"><span>{story.category_name || "The Daily Edit"}</span><i />{formatDate(story.createdAt)}</div><Link to={`/article/${story._id}`} className="story-title-link"><h2>{story.title}</h2></Link><p className="story-description">{story.description || story.content?.description}</p><div className="story-footer"><span><Clock3 size={13} /> {readTime(story.content?.description || story.description)}</span><button className={`save-button ${saved ? "is-saved" : ""}`} onClick={() => toggleSave(story)} aria-label={saved ? "Remove saved story" : "Save story"}>{saved ? <Check size={15} /> : <Bookmark size={15} />}</button></div></div>
  </article>;
}

function SearchOverlay({ onClose, onQuery }) {
  const [value, setValue] = useState("");
  useEffect(() => { const onKey = e => e.key === "Escape" && onClose(); window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey); }, [onClose]);
  return <div className="search-overlay" onClick={onClose}><div className="search-panel" onClick={e => e.stopPropagation()}><Search size={21} /><input autoFocus placeholder="Search stories, topics, ideas…" value={value} onChange={e => { setValue(e.target.value); onQuery(e.target.value); }} onKeyDown={e => e.key === "Enter" && onClose()} /><button className="icon-button" onClick={onClose} aria-label="Close search"><X /></button><span className="search-hint">ESC</span></div></div>;
}

function Home({ stories, categories, loading, error, retry, search, setSearch, saved, toggleSave }) {
  const [activeCategory, setActiveCategory] = useState("All stories");
  const filtered = useMemo(() => stories.filter(s => (activeCategory === "All stories" || s.category_name === activeCategory) && `${s.title} ${s.description} ${s.category_name} ${s.author}`.toLowerCase().includes(search.toLowerCase())), [stories, activeCategory, search]);
  const hero = filtered[0];
  return <main>
    <section className="intro-section"><div className="shell intro-inner"><div><span className="eyebrow"><span className="live-dot" /> THE WORLD, WELL REPORTED</span><h1>News with <em>perspective.</em></h1><p>Thoughtful reporting for people who want to understand more.</p></div><a className="explore-link" href="#latest">Explore today’s stories <ArrowDown size={15} /></a></div></section>
    <div className="shell"><section className="hero-grid" aria-label="Top story">
      {loading ? <div className="hero-skeleton skeleton" /> : hero ? <>
        <Link to={`/article/${hero._id}`} className="hero-image"><NewsImage src={imageUrl(hero.image)} alt="" /><span className="image-scrim" /><span className="hero-image-label"><span className="live-dot" /> TODAY’S LEAD</span></Link>
        <div className="hero-story"><div className="story-meta"><span>{hero.category_name || "The Daily Edit"}</span><i />{formatDate(hero.createdAt)}</div><Link to={`/article/${hero._id}`}><h2>{hero.title}</h2></Link><p>{hero.description || hero.content?.description}</p><div className="hero-byline"><span className="author-avatar">{(hero.author || "N").slice(0,1).toUpperCase()}</span><span>Words by <strong>{hero.author || "NewsHub Editors"}</strong><small><Clock3 size={12} /> {readTime(hero.content?.description || hero.description)}</small></span></div><Link className="text-link" to={`/article/${hero._id}`}>Read the full story <ArrowRight size={16} /></Link></div>
      </> : <div className="empty-hero"><Sparkles size={24} /><h2>{error ? "We can’t reach the newsroom" : "A fresh perspective is on its way"}</h2><p>{error || "There are no stories published yet. Check back soon."}</p>{error && <button className="text-link" onClick={retry}>Try again <ArrowRight size={15} /></button>}</div>}
    </section></div>
    <section className="ticker"><div className="shell ticker-inner"><span className="ticker-label">THE DAILY EDIT</span><span className="ticker-line" /><span>Reporting that gets beneath the surface</span><Sparkles size={15} /></div></section>
    <section className="shell latest-section" id="latest"><div className="section-heading"><div><span className="eyebrow">A LITTLE MORE CONTEXT</span><h2>Latest stories<span>.</span></h2></div><Link to="/premium" className="members-link"><Crown size={15} /> Unlock member stories <ChevronRight size={15} /></Link></div>
      <div className="category-bar"><div className="category-tabs" role="tablist"><button className={activeCategory === "All stories" ? "active" : ""} onClick={() => setActiveCategory("All stories")}>All stories <span>{stories.length}</span></button>{categories.map(c => <button key={c.name} className={activeCategory === c.name ? "active" : ""} onClick={() => setActiveCategory(c.name)}>{c.name}</button>)}</div>{search && <button className="clear-search" onClick={() => setSearch("")}>Clear search “{search}” <X size={13} /></button>}</div>
      {loading ? <div className="story-grid">{[0,1,2].map(n => <div className="story-skeleton skeleton" key={n} />)}</div> : filtered.length ? <div className="story-grid">{filtered.slice(hero ? 1 : 0).map((story, i) => <StoryCard key={story._id} story={story} saved={saved.some(x => x._id === story._id)} toggleSave={toggleSave} index={i} />)}</div> : <div className="no-results"><Search size={24} /><h3>No stories found</h3><p>Try another search or browse all of today’s reporting.</p><button className="text-link" onClick={() => {setSearch("");setActiveCategory("All stories");}}>Show all stories <ArrowRight size={15} /></button></div>}
    </section>
    <section className="membership-banner"><div className="shell membership-inner"><div className="membership-icon"><Crown size={21} /></div><div><span className="eyebrow">FOR THE CURIOUS</span><h2>Go beyond the headlines.</h2><p>Unlimited member stories. A fuller picture of the world.</p></div><Link to="/premium" className="banner-button">Explore membership <ArrowRight size={16} /></Link></div></section>
    <footer className="site-footer"><div className="shell footer-main"><Link to="/" className="wordmark">news<span>hub</span><i>.</i></Link><p>Independent journalism for a curious world.</p><div><Link to="/saved">Saved stories</Link><Link to="/admin/login">Newsroom</Link></div></div><div className="shell footer-bottom"><span>© 2026 NewsHub. Read widely. Think clearly.</span><span>Made for a world that keeps asking why.</span></div></footer>
  </main>;
}

export default function App() {
  const [stories, setStories] = useState([]); const [categories, setCategories] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const [searchOpen, setSearchOpen] = useState(false); const [search, setSearch] = useState("");
  const [saved, setSaved] = useState(() => JSON.parse(localStorage.getItem("savedStories") || "[]"));
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user") || "null")); const location = useLocation(); const navigate = useNavigate(); const toastMessage = location.state?.successToast;
  const load = useCallback(async () => { setLoading(true); setError(""); try { const [news, cats] = await Promise.all([api.get("/api/news/public-news"), api.get("/api/category/fetch-all-category")]); setStories(news.data.data || []); setCategories(cats.data.data || []); } catch (e) { setError(e.response ? "The newsroom is temporarily unavailable. Please try again." : "Could not connect to the NewsHub server. Make sure the backend is running at " + (api.defaults.baseURL || "http://localhost:5000") + "."); } finally { setLoading(false); } }, []);
  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, [load]); useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);
  useEffect(() => { if (!toastMessage) return undefined; const timer = window.setTimeout(() => navigate(`${location.pathname}${location.search}`, { replace: true, state: null }), 4500); return () => window.clearTimeout(timer); }, [toastMessage, location.pathname, location.search, navigate]);
  useEffect(() => { const update = () => setUser(JSON.parse(localStorage.getItem("user") || "null")); window.addEventListener("storage", update); window.addEventListener("newshub-auth", update); return () => {window.removeEventListener("storage", update);window.removeEventListener("newshub-auth", update);}; }, []);
  const toggleSave = story => { const next = saved.some(s => s._id === story._id) ? saved.filter(s => s._id !== story._id) : [story, ...saved]; setSaved(next); localStorage.setItem("savedStories", JSON.stringify(next)); };
  return <><Header categories={categories} user={user} onSearch={() => setSearchOpen(true)} /><Routes><Route path="/" element={<Home stories={stories} categories={categories} loading={loading} error={error} retry={load} search={search} setSearch={setSearch} saved={saved} toggleSave={toggleSave} />} /><Route path="/article/:id" element={<Article key={location.pathname} stories={stories} saved={saved} toggleSave={toggleSave} />} /><Route path="/login" element={<Auth />} /><Route path="/register" element={<Auth initialMode="register" />} /><Route path="/saved" element={<SavedStories stories={saved} toggleSave={toggleSave} />} /><Route path="/premium" element={<Premium />} /><Route path="/admin/login" element={<AdminAuth />} /><Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} /><Route path="*" element={<main className="not-found"><span className="eyebrow">404 · LOST IN THE NEWS CYCLE</span><h1>This story isn’t here.</h1><Link to="/" className="text-link">Return to the front page <ArrowRight size={15} /></Link></main>} /></Routes>{toastMessage && <div className="success-toast" role="status"><span className="success-toast-icon"><Check size={16} /></span><span>{toastMessage}</span><button className="icon-button" onClick={() => navigate(`${location.pathname}${location.search}`, { replace: true, state: null })} aria-label="Dismiss notification"><X size={16} /></button></div>}{searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} onQuery={setSearch} />}</>;
}
