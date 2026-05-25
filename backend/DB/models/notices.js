import mongoose from "mongoose";

const paripatrakSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      trim: true,
    },
    pdfUrl: {
      type: String, //OPTIONAL
    },
    publicId: {
      type: String, //OPTIONAL
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default paripatrakSchema;
