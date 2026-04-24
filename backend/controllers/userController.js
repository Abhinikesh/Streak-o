import User from '../models/User.js';

export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const secure_url = req.file.path;
    const userId = req.user._id;

    const user = await User.findByIdAndUpdate(
      userId,
      { avatar: secure_url },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ avatar: secure_url });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ message: 'Server error during avatar upload' });
  }
};
