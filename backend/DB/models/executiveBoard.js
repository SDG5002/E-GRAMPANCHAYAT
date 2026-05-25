// DB/models/executiveBoard.js
import mongoose from "mongoose";

const DEFAULT_IMG = "/images/profile.png";

const Person = new mongoose.Schema({
  _id: { type: String },      
  role: String,            
  name: { type: String, required: true },
  mobile: String,
  image: { type: String, default: DEFAULT_IMG },
  imageId: String,
});

const ExecutiveBoardSchema = new mongoose.Schema({
  sarpanch: { type: Person, required: true },
  upsarpanch: { type: Person, required: true },
  members: { type: [Person], default: [] },
  officers: { type: [Person], default: [] },
});

export default ExecutiveBoardSchema;
