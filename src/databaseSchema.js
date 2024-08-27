const bandSchema = new mongoose.Schema({
    bandName: String,
    contactEmail: String,
    instagram: String,
    genre: String,
});
const eventSchema = new mongoose.Schema({
    showDate: Date,
    requestDate: Date,
    bands: [bandSchema],
    contactBand: bandSchema,
    matinee:Boolean,
    ticketPrice:Number,
    ticketsSold:Number,
    showStatus:Number
});