import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Bookmark, Check, Clock3, Crown, Share2 } from "lucide-react";
import api, { imageUrl } from "./api/axios";
import NewsImage from "./NewsImage";

const date = value => value ? new Intl.DateTimeFormat("en", { month: "long", day: "numeric", year: "numeric" }).format(new Date(value)) : "NewsHub";

export default function Article({ stories, saved = [], toggleSave = () => {} }) {
  const { id } = useParams(); const navigate = useNavigate(); const [fetchedStory, setStory] = useState(() => stories.find(s => s._id === id) || null); const story = stories.find(s => s._id === id) || fetchedStory; const [loading, setLoading] = useState(!story); const [error, setError] = useState(""); const [accessDenied, setAccessDenied] = useState(false);
  useEffect(() => {
    if (stories.some((item) => item._id === id)) return undefined;
    let active = true;
    async function loadStory() {
      try {
        const publicResponse = await api.get("/api/news/public-news");
        let item = (publicResponse.data.data || []).find((news) => news._id === id);
        if (!item) {
          const token = localStorage.getItem("token");
          if (!token) { if (active) setAccessDenied(true); return; }
          try {
            const paidResponse = await api.get("/api/news/fetch-all-paid-news", { headers: { token } });
            item = (paidResponse.data.data || []).find((news) => news._id === id);
          } catch (paidError) {
            if (paidError.response?.status === 401 || paidError.response?.status === 403) { if (active) setAccessDenied(true); return; }
            throw paidError;
          }
        }
        if (active) {
          setStory(item || null);
          if (!item) setError("This story may have been removed or is no longer available.");
        }
      } catch {
        if (active) setError("We couldn’t load this story. Please try again.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadStory();
    return () => { active = false; };
  }, [id, stories]);
  const [copied, setCopied] = useState(false);
  async function share() { try { await navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { window.prompt("Copy this story link", window.location.href); } }
  if (loading && !story) return <main className="article-loading shell"><div className="skeleton story-skeleton" /></main>;
  if (!story && accessDenied) return <main className="article-error article-locked"><span className="locked-icon"><Crown size={23} /></span><span className="eyebrow">A NEWSHUB MEMBER FEATURE</span><h1>This story is for members.</h1><p>Join NewsHub Premium to read original reporting and thoughtful long-form analysis.</p><Link className="locked-cta" to="/premium">Explore membership <ArrowRight size={15} /></Link>{localStorage.getItem("token") ? <Link className="text-link" to="/premium">Already a member? Open your library <ArrowRight size={15} /></Link> : <Link className="text-link" to="/login">Sign in to your account <ArrowRight size={15} /></Link>}</main>;
  if (!story) return <main className="article-error"><span className="eyebrow">STORY UNAVAILABLE</span><h1>{error || "We couldn’t find that story."}</h1><Link className="text-link" to="/">Back to the front page <ArrowRight size={15} /></Link></main>;
  const isSaved = saved.some(s => s._id === story._id); const paragraphs = (story.content?.description || story.description || "").split(/\n{2,}/).filter(Boolean);
  return <main className="article-page"><div className="shell article-shell"><button className="back-link" onClick={() => navigate(-1)}><ArrowLeft size={15} /> Back to today</button><article>
    <div className="article-heading"><div className="story-meta"><span>{story.category_name || "The Daily Edit"}</span><i />{date(story.createdAt)}</div>{story.isPremium && <span className="premium-pill"><Crown size={12} /> Member story</span>}<h1>{story.title}</h1><p className="article-deck">{story.content?.headline || story.description}</p><div className="article-byline"><span className="author-avatar">{(story.author || "N").slice(0,1).toUpperCase()}</span><div><strong>{story.author || "NewsHub Editors"}</strong><span>NewsHub correspondent · <Clock3 size={12} /> {Math.max(3, Math.ceil((paragraphs.join(" ").split(/\s+/).length || 500) / 220))} min read</span></div><div className="article-tools"><button className={`save-button ${isSaved ? "is-saved" : ""}`} onClick={() => toggleSave(story)} aria-label={isSaved ? "Remove saved story" : "Save story"}>{isSaved ? <Check size={16} /> : <Bookmark size={16} />}</button><button className="save-button" onClick={share} aria-label="Share story"><Share2 size={16} /></button></div></div></div>
    <figure className="article-cover"><NewsImage src={imageUrl(story.image)} alt="" /><figcaption>{story.description}</figcaption></figure><div className="article-body"><p className="article-lede">{story.content?.headline || story.description}</p>{paragraphs.map((paragraph, i) => <p key={i}>{paragraph}</p>)}<div className="article-end"><span /> END OF STORY <span /></div><div className="article-actions-bottom"><button className={`text-link ${isSaved ? "is-saved" : ""}`} onClick={() => toggleSave(story)}>{isSaved ? <Check size={16} /> : <Bookmark size={16} />}{isSaved ? "Saved to your reading list" : "Save for later"}</button><button className="text-link" onClick={share}>{copied ? <Check size={15} /> : <Share2 size={15} />}{copied ? "Link copied" : "Share this story"}</button></div></div>
  </article>{!story.isPremium && <section className="article-membership"><Crown size={19} /><div><strong>There’s more to the story.</strong><span>Explore reporting made for curious minds.</span></div><Link to="/premium">Discover membership <ArrowRight size={15} /></Link></section>}</div></main>;
}
