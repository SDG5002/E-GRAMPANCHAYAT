import DevelopementWorkSchema from "../DB/models/developementWorks.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../middlewares/cloudinaryUpload.js";
import wrapAsync from "../utils/wrapAsync.js";
import ExpressError from "../utils/ExpressError.js";


export const getDevWorks = wrapAsync(async (req, res) => {
  const conn = req.dbConnection; 
  const DevelopementWork = conn.model("DevelopementWork", DevelopementWorkSchema);

  const works = await DevelopementWork.find().sort({ date: -1 });

  res.json(works);

  
});


export const createDevWorks = wrapAsync(async (req, res) => {
  const conn = req.dbConnection;
  const DevelopementWork = conn.model("DevelopementWork", DevelopementWorkSchema);

  const { title, description } = req.body;
  if (!title || !description) throw new ExpressError("Title and description are required", 400);

  const file = req.file;
  if (!file) throw new ExpressError("Image is required", 400);

  const uploadRes = await uploadToCloudinary(
    file.path,
    `${req.gpName}/devworks`,
    `devwork_${Date.now()}`
  );
  if (!uploadRes) throw new ExpressError("Image upload failed", 500);

  const saved = await DevelopementWork.create({
    title,
    description,
    date: new Date(),
    image: { url: uploadRes.url, publicId: uploadRes.public_id },
  });

  res.status(201).json(saved);
});


export const deleteDevWork = wrapAsync(async (req, res) => {

  const id=req.params.id;
  if(!id) throw new ExpressError("Work id is required", 400);
  const conn = req.dbConnection;
  const DevelopementWork = conn.model("DevelopementWork", DevelopementWorkSchema);

  const work = await DevelopementWork.findById(id);
  if (!work) throw new ExpressError("Work not found", 404);

 
  if (work.image?.publicId) {
    await deleteFromCloudinary(work.image.publicId);
  }

  await DevelopementWork.findByIdAndDelete(id);
  res.json({ success: true });
});
