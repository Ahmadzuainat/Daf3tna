import mongoose from 'mongoose';

const otpVerificationSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300, // The document will be automatically deleted after 5 minutes (300 seconds)
  },
  type: {
    type: String,
    enum: ['register', 'reset-password'],
    required: true,
  },
  userData: {
    type: Object, // Temporarily store user data until verification (Optional for reset-password)
    required: false,
  }
});

const OTPVerification = mongoose.model('OTPVerification', otpVerificationSchema);

export default OTPVerification;
