require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 1. Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB Connected Successfully'))
.catch(err => console.error('MongoDB Connection Error:', err));

// 2. Define Mongoose Schema & Model
const OrderSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true },
    bottleSize: { type: String, required: true },
    quantity: { type: Number, required: true },
    address: { type: String },
    createdAt: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', OrderSchema);

// 3. Configure Nodemailer Transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// 4. API Endpoint to handle Order Enquiry
app.post('/api/order', async (req, res) => {
    try {
        const { userName, userPhone, bottleSize, bottleQty, userAddress } = req.body;

        // Save order to Database
        const newOrder = new Order({
            name: userName,
            phone: userPhone,
            bottleSize,
            quantity: bottleQty,
            address: userAddress,
        });

        await newOrder.save();

        // Send Email Notification
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.RECEIVER_EMAIL,
            subject: `New Water Order Enquiry from ${userName}`,
            html: `
                <h3>New Order Enquiry Received</h3>
                <p><strong>Name:</strong> ${userName}</p>
                <p><strong>Phone:</strong> ${userPhone}</p>
                <p><strong>Bottle Size:</strong> ${bottleSize}</p>
                <p><strong>Quantity:</strong> ${bottleQty}</p>
                <p><strong>Address / Requirement:</strong> ${userAddress || 'N/A'}</p>
                <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            `,
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ success: true, message: 'Order submitted and email sent successfully!' });

    } catch (error) {
        console.error('Error handling order:', error);
        res.status(500).json({ success: false, message: 'Server error processing your request.' });
    }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});