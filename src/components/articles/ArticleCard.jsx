import { Link } from "react-router-dom";
import { format } from "date-fns";

export default function ArticleCard({ article, size = "default" }) {
  const date = article.published_date ? format(new Date(article.published_date), "MMM d, yyyy") : "";

  if (size === "hero") {
    return (
      <Link to={`/article/${article.slug || article.id}`} className="block group relative overflow-hidden rounded-lg">
        <div className="aspect-[16/9] w-full overflow-hidden">
          {article.featured_image ? (
            <img src={article.featured_image} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full bg-secondary flex items-center justify-center">
              <span className="text-muted-foreground font-inter text-sm">No Image</span>
            </div>
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <span className="inline-block bg-primary text-white text-xs font-oswald font-semibold tracking-widest uppercase px-3 py-1 rounded mb-3">
            {article.category}
          </span>
          <h2 className="font-oswald font-bold text-white text-2xl md:text-3xl leading-tight uppercase group-hover:text-primary transition-colors">
            {article.title}
          </h2>
          <div className="flex items-center gap-3 mt-3">
            <span className="text-muted-foreground font-inter text-xs">{date}</span>
            {article.author_name && (
              <span className="text-muted-foreground font-inter text-xs">By {article.author_name}</span>
            )}
          </div>
        </div>
      </Link>
    );
  }

  if (size === "small") {
    return (
      <Link to={`/article/${article.slug || article.id}`} className="flex gap-3 group items-start">
        <div className="w-20 h-16 shrink-0 overflow-hidden rounded">
          {article.featured_image ? (
            <img src={article.featured_image} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full bg-secondary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-primary font-oswald text-xs font-semibold tracking-wider uppercase">{article.category}</span>
          <h4 className="font-oswald font-semibold text-white text-sm leading-tight mt-0.5 group-hover:text-primary transition-colors line-clamp-2 uppercase">
            {article.title}
          </h4>
          <span className="text-muted-foreground font-inter text-xs">{date}</span>
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/article/${article.slug || article.id}`} className="block group bg-card border border-border rounded-lg overflow-hidden hover:border-primary transition-colors duration-200">
      <div className="aspect-[16/9] overflow-hidden">
        {article.featured_image ? (
          <img src={article.featured_image} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full bg-secondary flex items-center justify-center">
            <span className="text-muted-foreground text-xs font-inter">No Image</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <span className="inline-block bg-primary text-white text-xs font-oswald font-semibold tracking-widest uppercase px-2 py-0.5 rounded mb-2">
          {article.category}
        </span>
        <h3 className="font-oswald font-bold text-white text-base leading-tight uppercase group-hover:text-primary transition-colors line-clamp-2">
          {article.title}
        </h3>
        {article.excerpt && (
          <p className="text-muted-foreground font-inter text-xs mt-2 line-clamp-2">{article.excerpt}</p>
        )}
        <div className="flex items-center gap-2 mt-3">
          <span className="text-muted-foreground font-inter text-xs">{date}</span>
          {article.author_name && (
            <span className="text-muted-foreground font-inter text-xs">· {article.author_name}</span>
          )}
        </div>
      </div>
    </Link>
  );
}