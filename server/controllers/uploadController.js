exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { mimetype, originalname, size, filename } = req.file;

    let fileType = "document";
    if (mimetype.startsWith("image/")) {
      fileType = "image";
    } else if (mimetype.startsWith("video/")) {
      fileType = "video";
    } else if (mimetype.startsWith("audio/")) {
      fileType = "audio";
    }

    const fileUrl = `/uploads/${filename}`;

    return res.status(200).json({
      url: fileUrl,
      fileName: originalname,
      fileType,
      fileSize: size,
      mimeType: mimetype,
    });
  } catch (error) {
    console.error("Upload Error:", error);
    return res.status(500).json({ message: "File upload failed", error: error.message });
  }
};
