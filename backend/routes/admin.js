import { Router } from "express";
import { login, checkAuth, logout, refreshToken } from "../controllers/adminAuth.controller.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { imageUpload, pdfUpload } from "../middlewares/multerConfig.js";
import { changeExecutiveBoard } from "../controllers/executiveBoard.controller.js";
import { createDevWorks, deleteDevWork } from "../controllers/developementWorks.controller.js";
import { createNews, deleteNews } from "../controllers/news.controller.js";
import { createNotice, deleteNotice } from "../controllers/notices.controller.js";
import { uploadQR } from "../controllers/qr.controller.js";
import { listDakhala, deleteDakhala } from "../controllers/dakhalaMagani.controller.js";

const router = Router();


router.post("/login", login);
router.get("/check", checkAuth);//Used by frontends-RequireAuth
router.post("/logout", logout);
router.post("/refresh", refreshToken);

// Authentication is necessary for all the routes below this line
router.use(requireAuth);


router.post("/executive-board", imageUpload.any(), changeExecutiveBoard);


router.post("/devworks", imageUpload.any(), createDevWorks);
router.delete("/devworks/:id", deleteDevWork);


router.post("/news", createNews);
router.delete("/news/:id", deleteNews);


router.post("/notices", pdfUpload.single("pdfFile"), createNotice);
router.delete("/notices/:id", deleteNotice);


router.post(
  "/upload-qr",
  imageUpload.fields([
    { name: "panipattiQR", maxCount: 1 },
    { name: "gharPattiQR", maxCount: 1 },
    { name: "paymentQR", maxCount: 1 },
  ]),
  uploadQR
);


router.get("/submissions", listDakhala);
router.delete("/submissions/:id", deleteDakhala);

export default router;
