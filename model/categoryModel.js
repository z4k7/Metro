const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  image: {
    type: Array,
    // required: true,
  },
  isListed: {
    type: Boolean,
    default: true,
  },
  offer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Offers',
}
},
{
  timestamps: true
});

module.exports = mongoose.model("Categories", categorySchema);
