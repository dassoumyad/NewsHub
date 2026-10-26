import { Bookmark, BookmarkX, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { imageUrl } from "./api/axios";
import NewsImage from "./NewsImage";

export default function SavedStories({ stories = [], toggleSave = () => {} }) {
  return <main className="shell saved-page"><div className="eyebrow"><Bookmark size={14} /> YOUR READING LIST</div><h1>Stories to return to<span>.</span></h1><p className="saved-intro">A little shelf for the stories you want to sit with.</p>{stories.length ? <div className="saved-grid">{stories.map(story => <article className="saved-card" key={story._id}><Link to={`/article/${story._id}`}><NewsImage src={imageUrl(story.image)} alt="" /></Link><div><span className="eyebrow">{story.category_name}</span><Link to={`/article/${story._id}`}><h2>{story.title}</h2></Link><p>{story.description}</p><div className="saved-card-actions"><Link className="text-link" to={`/article/${story._id}`}>Continue reading <ArrowRight size={15} /></Link><button className="text-link remove-saved" onClick={() => toggleSave(story)}><BookmarkX size={15} /> Remove</button></div></div></article>)}</div> : <div className="saved-empty"><div className="empty-bookmark"><Bookmark size={22} /></div><h2>Your reading list is waiting.</h2><p>Save the stories that make you stop and think. They’ll be here when you’re ready.</p><Link to="/" className="text-link">Explore today’s stories <ArrowRight size={15} /></Link><Sparkles className="saved-sparkle" size={16} /></div>}</main>;
}
