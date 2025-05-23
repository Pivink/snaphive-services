import validator from "validator";
import bcrypt from "bcrypt";
import { v2 as cloudinary } from "cloudinary";
import professionalModel from "../models/professionalModel.js";
import jwt from "jsonwebtoken";
import bookingModel from "../models/bookingModel.js"
import userModel from "../models/userModel.js"

const addProfessional = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      speciality,
      degree,
      experience,
      about,
      fees,
      address,
    } = req.body;
    const imageFile = req.file;

    // Check if required fields are present
    if (
      !name ||
      !email ||
      !password ||
      !speciality ||
      !degree ||
      !experience ||
      !about ||
      !fees ||
      !address
    ) {
      return res.json({ success: false, message: "Details Missing" });
    }

    // Validate email format
    if (!validator.isEmail(email)) {
      return res.json({
        success: false,
        message: "Please enter a valid email",
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.json({
        success: false,
        message: "Please enter a strong password (min 8 characters)",
      });
    }

    // Parse address safely
    let parsedAddress;
    try {
      parsedAddress = JSON.parse(address);
    } catch (error) {
      return res.json({ success: false, message: "Invalid address format" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Upload image to Cloudinary
    let imageUrl = "";
    if (imageFile) {
      const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
        resource_type: "image",
      });
      imageUrl = imageUpload.secure_url;
    }

    // Save professional data
    const proData = new professionalModel({
      name,
      email,
      image: imageUrl,
      password: hashedPassword,
      speciality,
      degree,
      experience,
      about,
      fees,
      address: parsedAddress,
      date: Date.now(),
    });

    await proData.save();

    res.json({ success: true, message: "Professional Added Successfully" });
  } catch (error) {
    console.log("Error:", error);
    res.json({ success: false, message: error.message });
  }
};

// API for Admin Login
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      email === process.env.ADMIN_EMAIL &&
      password === process.env.ADMIN_PASSWORD
    ) {
      const token = jwt.sign(email + password, process.env.JWT_SECRET);
      res.json({ success: true, token });
    } else {
      res.json({ success: false, message: "Invaild Credentials" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

//Api to get all professional list for admin panel
const allProfessionals = async (req, res) => {

  try{
    const professionals = await professionalModel.find({}).select('-password')
    res.json({success:true, professionals})
  }catch(error){
    res.json({success:false, message:error.message})
  }
}

// Api to get all Professional list
const bookingsAdmin = async (req, res) => {
  try {

      const bookings = await bookingModel.find({})
      res.json({ success: true, bookings })

  } catch (error) {
      console.log(error)
      res.json({ success: false, message: error.message })
  }

}

const adminDashboard = async (req, res) => {
  try {

      const professionals = await professionalModel.find({})
      const users = await userModel.find({})
      const bookings = await bookingModel.find({})

      const dashData = {
          professionals: professionals.length,
          bookings: bookings.length,
          clients: users.length,
          latestBookings: bookings.reverse().slice(0, 5)
      }

      res.json({ success: true, dashData })

  } catch (error) {
      console.log(error)
      res.json({ success: false, message: error.message })
  }
}

const bookingCancel = async (req, res) => {
  try {

      const { bookingId } = req.body
      await bookingModel.findByIdAndUpdate(bookingId, { cancelled: true })

      res.json({ success: true, message: 'Booking Cancelled' })

  } catch (error) {
      console.log(error)
      res.json({ success: false, message: error.message })
  }

}

export { addProfessional, loginAdmin, allProfessionals, bookingsAdmin, bookingCancel, adminDashboard };
