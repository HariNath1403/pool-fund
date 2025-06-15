const jwt = require("jsonwebtoken");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const { cloudinary } = require("./config");

const { User } = require("./model");

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    next();
  } catch (err) {
    console.error("JWT Verification Error:", err.message);
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "pool-fund/attachments",
    allowed_formats: ["jpg", "png", "pdf"],
    public_id: (req, file) => `${Date.now()}-${file.originalname}`,
  },
});

const upload = multer({ storage });

const deleteOldAttachment = async (req, res, next) => {
  const { currentUrl } = req.body;
  if (!currentUrl) {
    return next();
  }

  try {
    const parts = currentUrl.split("/");
    const filename = parts[parts.length - 1];
    const publicId = filename.split(".")[0];

    const cloudinaryPath = `pool-fund/attachments/${publicId}`;

    await cloudinary.uploader.destroy(cloudinaryPath);

    console.log(`Deleted old Cloudinary file: ${cloudinaryPath}`);
    next();
  } catch (err) {
    console.warn("Could not delete old Cloudinary file: ", err.message);
    next();
  }
};

const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  res.redirect("/login");
};

module.exports = {
  verifyToken,
  upload,
  deleteOldAttachment,
  isAuthenticated,
};
