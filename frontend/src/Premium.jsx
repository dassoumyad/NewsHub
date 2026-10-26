import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Clock3, Crown, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import api, { imageUrl } from "./api/axios";
import NewsImage from "./NewsImage";
import "./Premium.css";

const RAZORPAY_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const existingScript = document.querySelector(`script[src="${RAZORPAY_SCRIPT}"]`);
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(true), { once: true });
      existingScript.addEventListener("error", () => resolve(false), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function getErrorMessage(error) {
  return error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || error.message || "Something went wrong. Please try again.";
}

export default function Premium() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [memberStatus, setMemberStatus] = useState(() => localStorage.getItem("token") ? "checking" : "signed-out");
  const [stories, setStories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All stories");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return undefined;
    let active = true;
    api.get("/api/news/fetch-all-paid-news", { headers: { token } })
      .then(({ data }) => { if (active) { setStories(data.data || []); setMemberStatus("active"); } })
      .catch((error) => { if (active) setMemberStatus(error.response?.status === 403 ? "inactive" : "error"); })
      .finally(() => { if (active) setMemberStatus((current) => current === "checking" ? "inactive" : current); });
    return () => { active = false; };
  }, []);

  const categories = useMemo(() => [...new Set(stories.map((story) => story.category_name).filter(Boolean))], [stories]);
  const visibleStories = useMemo(() => stories.filter((story) => activeCategory === "All stories" || story.category_name === activeCategory), [stories, activeCategory]);

  async function startSubscription() {
    const token = localStorage.getItem("token");
    if (!token) {
      setMessage("Sign in to continue with your NewsHub membership.");
      return;
    }
    setStatus("loading");
    setMessage("");
    try {
      const scriptLoaded = await loadRazorpay();
      if (!scriptLoaded || !window.Razorpay) throw new Error("Razorpay Checkout could not be loaded.");
      const headers = { headers: { token } };
      const orderResponse = await api.post("/api/subscription/create-order", {}, headers);
      const { order, key_id: keyId } = orderResponse.data;
      const user = JSON.parse(localStorage.getItem("user") || "null");

      await new Promise((resolve, reject) => {
        const checkout = new window.Razorpay({
          key: keyId,
          amount: order.amount,
          currency: order.currency || "INR",
          name: "NewsHub",
          description: "One year NewsHub membership",
          order_id: order.id,
          prefill: { name: user?.name, email: user?.email },
          theme: { color: "#8f1d32" },
          handler: async (payment) => {
            try {
              await api.post("/api/subscription/verify-order", payment, headers);
              setStatus("success");
              setMessage("Your membership is active. Welcome to NewsHub Premium.");
              navigate("/", { replace: true, state: { successToast: "Your Premium membership is active. Enjoy the deeper read." } });
              resolve();
            } catch (error) { reject(error); }
          },
          modal: { ondismiss: () => reject(new Error("Payment was cancelled.")) },
        });
        checkout.on("payment.failed", (event) => reject(new Error(event.error?.description || "Payment failed.")));
        checkout.open();
      });
    } catch (error) {
      setStatus("error");
      setMessage(getErrorMessage(error));
    }
  }

  const isLoading = status === "loading";
  if (memberStatus === "active") {
    return <main className="member-library-page"><div className="shell member-library-shell"><Link to="/" className="premium-back"><ArrowLeft size={16} /> Back to NewsHub</Link><section className="library-heading"><div className="library-crown"><Crown size={22} /></div><div><span className="eyebrow">NEWSHUB MEMBER LIBRARY</span><h1>Go beyond the headline<span>.</span></h1><p>Original reporting and deep analysis, written for the questions that deserve more than a quick answer.</p></div><span className="member-active-badge"><Check size={14} /> MEMBERSHIP ACTIVE</span></section>{categories.length > 1 && <div className="library-filters"><button className={activeCategory === "All stories" ? "active" : ""} onClick={() => setActiveCategory("All stories")}>All stories <span>{stories.length}</span></button>{categories.map((category) => <button key={category} className={activeCategory === category ? "active" : ""} onClick={() => setActiveCategory(category)}>{category}</button>)}</div>}{visibleStories.length ? <div className="member-story-grid">{visibleStories.map((story, index) => <article className={`member-story-card ${index === 0 ? "member-story-featured" : ""}`} key={story._id}><Link to={`/article/${story._id}`} className="member-story-image"><NewsImage src={imageUrl(story.image)} alt="" loading={index < 3 ? "eager" : "lazy"} /><span><Crown size={12} /> MEMBER FEATURE</span></Link><div className="member-story-copy"><div className="story-meta"><span>{story.category_name}</span><i />LONG READ</div><Link to={`/article/${story._id}`}><h2>{story.title}</h2></Link><p>{story.description || story.content?.headline}</p><div className="member-story-footer"><span>{story.author || "NewsHub Special Projects"}</span><span><Clock3 size={13} /> {Math.max(5, Math.ceil((story.content?.description || "").split(/\s+/).length / 220))} min read</span></div><Link to={`/article/${story._id}`} className="text-link">Read the feature <ArrowRight size={15} /></Link></div></article>)}</div> : <div className="library-empty"><Sparkles size={22} /><h2>Your member library is being prepared.</h2><p>Come back soon for original reporting and long reads from NewsHub.</p></div>}</div></main>;
  }
  return (
    <main className="premium-page">
      <div className="premium-orb premium-orb-one" /><div className="premium-orb premium-orb-two" />
      <Link to="/" className="premium-back"><ArrowLeft size={16} /> Back to NewsHub</Link>
      <section className="premium-card">
        <div className="premium-card-intro">
          <div className="premium-icon"><Crown size={25} /></div>
          <p className="premium-label">NEWSHUB MEMBERSHIP</p>
          <h1>Go beyond <em>the headlines.</em></h1>
          <p className="premium-description">Read the reporting that gives you context, perspective, and a clearer view of the world.</p>
        </div>
        <div className="premium-offer"><div><span className="premium-offer-label">ANNUAL MEMBERSHIP</span><div className="premium-price">₹99 <span>/ year</span></div></div><span className="premium-save-badge">BEST VALUE</span></div>
        <ul className="premium-benefits">
          <li><Check size={17} /> Unlimited access to premium articles</li><li><Check size={17} /> In-depth reporting and analysis</li><li><Check size={17} /> Support independent journalism</li>
        </ul>
        <button type="button" className="premium-button" onClick={startSubscription} disabled={isLoading || status === "success"}>
          {isLoading ? "Preparing secure checkout..." : status === "success" ? "Membership active" : "Subscribe securely"}{!isLoading && status !== "success" && <ArrowRight size={18} />}
        </button>
        {message && <div className={`premium-message premium-message-${status}`} role={status === "error" ? "alert" : "status"}>{message}{!localStorage.getItem("token") && <button type="button" onClick={() => navigate("/login")}>Sign in <ArrowRight size={14} /></button>}</div>}
        <div className="premium-trust"><span><ShieldCheck size={15} /> Secure Razorpay checkout</span><span><LockKeyhole size={15} /> Your payment is encrypted</span></div>
        <p className="premium-note"><Sparkles size={13} /> Cancel anytime. No hidden fees.</p>
      </section>
      {memberStatus === "checking" && <div className="premium-access-check" role="status">Checking your NewsHub membership…</div>}
    </main>
  );
}
