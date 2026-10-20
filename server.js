require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// ================= MIDDLEWARE =================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve HTML, CSS, JS and images from public/
app.use(express.static(path.join(__dirname, 'public')));

// ================= MONGODB CONNECTION =================
const OrderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  phone: {
    type: String,
    required: true,
    match: /^\d{10}$/,
  },
  bottleSize: {
    type: String,
    required: true,
    enum: ['200ml', '500ml', '1 Liter', '2 Liter', '6 Liter', '20 Liter'],
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    max: 100000,
  },
  address: {
    type: String,
    default: '',
    maxlength: 2000,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Order = mongoose.model('Order', OrderSchema);

// ================= EMAIL CONFIGURATION =================
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Escape user-provided content before inserting it into HTML emails.
function escapeHtml(value) {
  return String(value ?? '').replace(
    /[&<>"']/g,
    (char) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[char]
  );
}

// ================= ORDER ENQUIRY API =================
app.post('/api/order', async (req, res) => {
  try {
    const { userName, userPhone, bottleSize, bottleQty, userAddress } =
      req.body;

    // Validate submitted data
    const allowedBottleSizes = [
      '200ml',
      '500ml',
      '1 Liter',
      '2 Liter',
      '6 Liter',
      '20 Liter',
    ];

    if (
      typeof userName !== 'string' ||
      !userName.trim() ||
      userName.trim().length > 100 ||
      typeof userPhone !== 'string' ||
      !/^\d{10}$/.test(userPhone) ||
      typeof bottleSize !== 'string' ||
      !allowedBottleSizes.includes(bottleSize) ||
      !Number.isInteger(Number(bottleQty)) ||
      Number(bottleQty) < 1 ||
      Number(bottleQty) > 100000 ||
      (userAddress !== undefined &&
        (typeof userAddress !== 'string' || userAddress.length > 2000))
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please enter valid details in all required fields.',
      });
    }

    // Save enquiry to MongoDB
    const newOrder = await Order.create({
      name: userName.trim(),
      phone: userPhone,
      bottleSize,
      quantity: Number(bottleQty),
      address: (userAddress || '').trim(),
    });

    console.log('Order saved:', newOrder._id.toString());

    // Send email notification
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: process.env.RECEIVER_EMAIL,
        subject: `New Kavelt Order Enquiry from ${userName.trim()}`,
        text: [
          'New Kavelt Order Enquiry',
          `Name: ${userName.trim()}`,
          `Phone: ${userPhone}`,
          `Bottle Size: ${bottleSize}`,
          `Quantity: ${bottleQty}`,
          `Address / Requirement: ${userAddress || 'N/A'}`,
          `Order ID: ${newOrder._id}`,
          `Time: ${newOrder.createdAt.toLocaleString()}`,
        ].join('\n'),
        html: `
                    <h2>New Kavelt Order Enquiry</h2>
                    <p><strong>Name:</strong> ${escapeHtml(userName.trim())}</p>
                    <p><strong>Phone:</strong> ${escapeHtml(userPhone)}</p>
                    <p><strong>Bottle Size:</strong> ${escapeHtml(bottleSize)}</p>
                    <p><strong>Quantity:</strong> ${Number(bottleQty)}</p>
                    <p><strong>Address / Requirement:</strong> ${escapeHtml(userAddress || 'N/A')}</p>
                    <p><strong>Order ID:</strong> ${escapeHtml(newOrder._id)}</p>
                    <p><strong>Time:</strong> ${escapeHtml(newOrder.createdAt.toLocaleString())}</p>
                `,
      });

      console.log('Order notification email sent successfully.');
    } catch (emailError) {
      console.error('Email sending failed:', emailError.message);

      return res.status(502).json({
        success: false,
        orderSaved: true,
        message:
          'Your enquiry was saved, but the email notification failed. Please contact us before submitting again.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Your order enquiry was submitted successfully!',
    });
  } catch (error) {
    console.error('Order processing failed:', error);

    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Please check your enquiry details.',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Server error processing your request. Please try again.',
    });
  }
});

// ================= HEALTH CHECK =================
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Kavelt backend is running',
  });
});

// ================= START SERVER =================
async function startServer() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is missing from your .env file.');
    }

    if (
      !process.env.EMAIL_USER ||
      !process.env.EMAIL_PASS ||
      !process.env.RECEIVER_EMAIL
    ) {
      throw new Error('Email settings are missing from your .env file.');
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected Successfully');

    await transporter.verify();
    console.log('Email transporter verified successfully');

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Server startup failed:', error.message);
    process.exit(1);
  }
}

startServer();
