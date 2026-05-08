import mongoose, { Schema, Model } from 'mongoose';
import { IReview } from '../types';

interface IReviewModel extends Model<IReview> {
  calculateAverageRating(productId: mongoose.Types.ObjectId): Promise<void>;
}

const reviewSchema = new Schema<IReview>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  rating: {
    type: Number,
    required: [true, 'La calificación es requerida'],
    min: [1, 'La calificación mínima es 1'],
    max: [5, 'La calificación máxima es 5'],
  },
  title: {
    type: String,
    required: [true, 'El título es requerido'],
    trim: true,
    maxlength: [100, 'El título no puede exceder 100 caracteres'],
  },
  comment: {
    type: String,
    required: [true, 'El comentario es requerido'],
    trim: true,
    maxlength: [1000, 'El comentario no puede exceder 1000 caracteres'],
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Compound index to ensure one review per user per product
reviewSchema.index({ user: 1, product: 1 }, { unique: true });
reviewSchema.index({ product: 1 });
reviewSchema.index({ rating: -1 });

// Static method to calculate average rating
reviewSchema.statics.calculateAverageRating = async function(productId: mongoose.Types.ObjectId) {
  const stats = await this.aggregate([
    { $match: { product: productId } },
    {
      $group: {
        _id: '$product',
        avgRating: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await mongoose.model('Product').findByIdAndUpdate(productId, {
      rating: Math.round(stats[0].avgRating * 10) / 10,
      reviewCount: stats[0].count,
    });
  } else {
    await mongoose.model('Product').findByIdAndUpdate(productId, {
      rating: 0,
      reviewCount: 0,
    });
  }
};

// Update product rating after saving review
reviewSchema.post('save', async function() {
  await (this.constructor as any).calculateAverageRating(this.product);
});

// Update product rating after removing review
reviewSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    await Review.calculateAverageRating(doc.product);
  }
});

const Review = mongoose.model<IReview, IReviewModel>('Review', reviewSchema);

export default Review;
