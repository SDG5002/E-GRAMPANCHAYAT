import path from "path";
import wrapAsync from "../utils/wrapAsync.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../middlewares/cloudinaryUpload.js";
import QRSchema from "../DB/models/qrModel.js";


export const uploadQR = wrapAsync(async (req, res) => {
  const conn = req.dbConnection;
  const QR = conn.model("QR", QRSchema);

  let panipattiData = null;
  let gharPattiData = null;
  let paymentData = null;

 
  let qrDoc = await QR.findOne();

  
  const files = req.files || {};

  
  const panipattiFile = files.panipattiQR?.[0];
  if (panipattiFile) {
    if (qrDoc?.panipattiQR?.publicId) {
      await deleteFromCloudinary(qrDoc.panipattiQR.publicId);
    }
    panipattiData = await uploadToCloudinary(
      path.resolve(panipattiFile.path),//RESOLVE CONVERTS RELATIVE PATH TO ABSOLUTE PATH ITS NODE FUNCTION
      `${req.gpName}/qrCodes`,
      "panipattiQR"
    );
  }

  
  const gharPattiFile = files.gharPattiQR?.[0];
  if (gharPattiFile) {
    if (qrDoc?.gharPattiQR?.publicId) {
      await deleteFromCloudinary(qrDoc.gharPattiQR.publicId);
    }
    gharPattiData = await uploadToCloudinary(
      path.resolve(gharPattiFile.path),
      `${req.gpName}/qrCodes`,
      "gharPattiQR"
    );
  }

  
  const formPaymentFile = files.paymentQR?.[0];
  if (formPaymentFile) {
    if (qrDoc?.paymentQR?.publicId) {
      await deleteFromCloudinary(qrDoc.paymentQR.publicId);
    }
    paymentData = await uploadToCloudinary(
      path.resolve(formPaymentFile.path),
      `${req.gpName}/qrCodes`,
      "paymentQR"
    );
  }

  if (!qrDoc) qrDoc = new QR();

  if (panipattiData) qrDoc.panipattiQR = { url: panipattiData.url, publicId: panipattiData.public_id};
  if (gharPattiData) qrDoc.gharPattiQR = { url: gharPattiData.url, publicId: gharPattiData.public_id };
  if (paymentData) qrDoc.paymentQR = { url: paymentData.url, publicId: paymentData.public_id };

  await qrDoc.save();

  res.json({ success: true, qrDoc });
});


export const getQR = wrapAsync(async (req, res) => {
  const conn = req.dbConnection;
  const QR = conn.model("QR", QRSchema);

  const qrDoc = await QR.findOne();
  res.json(qrDoc || {});
});
