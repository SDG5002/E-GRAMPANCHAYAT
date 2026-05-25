import wrapAsync from "../utils/wrapAsync.js";
import ExpressError from "../utils/ExpressError.js";
import NewsSchema from "../DB/models/news.js"; 

//CREATE NEWS
export const createNews = wrapAsync(async (req, res) => {
  const conn = req.dbConnection;
  const News = conn.model("News", NewsSchema);

  const { text } = req.body;
  if (!text || !text.trim()) {
    throw new ExpressError("News text is required", 400);
  }

  const news = await News.create({ text: text.trim() });
  res.status(201).json(news);
});

//GET NEWS

export const getNews = wrapAsync(async (req, res) => {
  const conn = req.dbConnection;
  const News = conn.model("News", NewsSchema);

  const allNews = await News.find().sort({ createdAt: -1 });
  res.json(allNews);
});


//DELETE NEWS
export const deleteNews = wrapAsync(async (req, res) => {
  const conn = req.dbConnection;
  const News = conn.model("News", NewsSchema);

  const { id } = req.params;
  const deleted = await News.findByIdAndDelete(id);
  if (!deleted) throw new ExpressError("News item not found", 404);
  res.json({ success: true });
});
