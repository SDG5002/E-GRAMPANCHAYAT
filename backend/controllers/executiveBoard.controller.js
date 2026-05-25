
import wrapAsync from "../utils/wrapAsync.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../middlewares/cloudinaryUpload.js";
import ExpressError from "../utils/ExpressError.js";
import ExecutiveBoardSchema from "../DB/models/executiveBoard.js";


export const changeExecutiveBoard = wrapAsync(async (req, res) => {
  const conn = req.dbConnection;
  const ExecutiveBoard = conn.model("ExecutiveBoard", ExecutiveBoardSchema);

  const body = req.body;
  let board = await ExecutiveBoard.findOne();

  //Nothing came for sarpanch means alredy
  //sarpanch is stored in db, user havent changed the sarpanch

  //If body have sarpanch either name changed or image changed or both
  const sarpanchData = body.sarpanch || {};
  const upsarpanchData = body.upsarpanch || {};

  const baseSarpanch = {
    _id: board?.sarpanch?._id,
    name: sarpanchData.name || board?.sarpanch?.name || "",
    mobile: sarpanchData.mobile || board?.sarpanch?.mobile || "",
    image: board?.sarpanch?.image,
    imageId: board?.sarpanch?.imageId,
  };

  const baseUpsarpanch = {
    _id: board?.upsarpanch?._id,
    name: upsarpanchData.name || board?.upsarpanch?.name || "",
    mobile: upsarpanchData.mobile || board?.upsarpanch?.mobile || "",
    image: board?.upsarpanch?.image,
    imageId: board?.upsarpanch?.imageId,
  };

  // handle deletions
  if (board) {
    if (body.deletedMemberIds?.length) {
      for (const id of body.deletedMemberIds) {
        const m = board.members.find(m => m._id.toString() === id);
        if (m) {
          if (m.imageId) await deleteFromCloudinary(m.imageId);
          m.deleteOne();
        }
      }
    }
    if (body.deletedOfficerIds?.length) {
      for (const id of body.deletedOfficerIds) {
        const o = board.officers.find(o => o._id.toString() === id);
        if (o) {
          if (o.imageId) await deleteFromCloudinary(o.imageId);
          o.deleteOne();
        }
      }
    }
  }

  // handle members
  const membersArr = body.members || [];
  const baseMembers = [];

  for (const m of membersArr) {
    let existing = m._id && board ? 
                    board.members.find(id => id.toString() === m._id) : null;

    if (existing) {
      existing.name = m.name;
      existing.mobile = m.mobile;
      baseMembers.push(existing);
    } else {

      if (!m.name && !m.mobile) {
        continue; 
      }
      
      baseMembers.push({
        _id: m._id,
        name: m.name,
        mobile: m.mobile,
      });
    }
  }

  //  Handle Officers 
  const officersArr = body.staff || [];
  const baseOfficers = [];

  for (const o of officersArr) {
    let existing = o._id && board ? board.officers.id(o._id) : null;

    if (existing) {
      existing.role = o.role;
      existing.name = o.name;
      existing.mobile = o.mobile;
      baseOfficers.push(existing);
    } else {
      
      if (!o.name && !o.role && !o.mobile) {
        continue; // Skip empty officer rows
      }

      baseOfficers.push({
        _id: o._id,
        role: o.role,
        name: o.name,
        mobile: o.mobile,
      });
    }
  }

  
const uploadSingle = (file, folder, name) => uploadToCloudinary(file.path, `${req.gpName}/executiveBoard/${folder}`, name);


for (const file of req.files || []) {
    const fname = file.fieldname;

    if (fname === "sarpanch") {

      if (baseSarpanch.imageId) await deleteFromCloudinary(baseSarpanch.imageId);
      const img = await uploadSingle(file, "sarpanch", baseSarpanch.name);
      baseSarpanch.image = img.url;
      baseSarpanch.imageId = img.public_id;

    } else if (fname === "upsarpanch") {
      if (baseUpsarpanch.imageId) await deleteFromCloudinary(baseUpsarpanch.imageId);
      const img = await uploadSingle(file, "upsarpanch", baseUpsarpanch.name);
      baseUpsarpanch.image = img.url;
      baseUpsarpanch.imageId = img.public_id;
      
    } 
    //Frontend is setting files like this 
    //formData.append(`memberImages[123e4567-e89b...]`, file1);
    //formData.append(`memberImages[123fa2rfwf-ff...]`, file2);

    //Multer parse this file as:
    //file = {fieldname: "memberImages[123e4567-e89b...]", originalname: "...", path: "...", ...}
    
    else if (fname.startsWith("memberImages[")) {
      const id = fname.match(/memberImages\[(.+)\]/)?.[1];
      const m = baseMembers.find(x => String(x._id) === id || String(x.id) === id);
      if (m) {
        if (m.imageId) await deleteFromCloudinary(m.imageId);
        const img = await uploadSingle(file, "members", m.name || "member");
        m.image = img.url;
        m.imageId = img.public_id;
      }
    } else if (fname.startsWith("officerImages[")) {
      const id = fname.match(/officerImages\[(.+)\]/)?.[1];
      const o = baseOfficers.find(x => String(x._id) === id || String(x.id) === id);
      if (o) {
        if (o.imageId) await deleteFromCloudinary(o.imageId);
        const img = await uploadSingle(file, "officers", o.role || "officer");
        o.image = img.url;
        o.imageId = img.public_id;
      }
    }
  }

  // Final payload
  const payload = {
    sarpanch: baseSarpanch,
    upsarpanch: baseUpsarpanch,
    members: baseMembers,
    officers: baseOfficers,
  };

  // save / update
  board = board
    ? await ExecutiveBoard.findByIdAndUpdate(board._id, payload, {
      new: true,
      runValidators: true,
    })
    : await ExecutiveBoard.create(payload);

  res.json(board);
});


//GET -Executive Board
export const getExecutiveBoard = wrapAsync(async (req, res) => {
  const conn = req.dbConnection;
  const ExecutiveBoard = conn.model("ExecutiveBoard", ExecutiveBoardSchema);

  const board = await ExecutiveBoard.findOne();
  if (!board) return res.status(404).json({ message: "No Executive Board data found" });
  res.json(board);
});
