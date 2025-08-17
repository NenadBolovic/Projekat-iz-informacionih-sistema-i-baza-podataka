import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const QuestionSchema = new Schema(
  {
    formId: { type: mongoose.Schema.Types.ObjectId, ref: 'Form', required: true },
    questionId: { type: Number, required: true },
    questionText: { type: String, required: true },
    questionType: {
      type: String,
      required: true,
      enum: ['short-text','long-text','multiple-choice-single','multiple-choice-multiple','numeric','date','time'],
    },
    required: { type: Boolean, default: false }, 
    options: {
      type: [{ text: { type: String, required: true } }],
      default: [],
      _id: false,
    },

    numericAttributes: {
      min: { type: Number, default: null },
      max: { type: Number, default: null },
      step: { type: Number, default: 1 }, 
    },
 
    questionImage: { type: String, default: null },
    maxLength: { type: Number }, 
  },
  { timestamps: true }
);

export default model('Question', QuestionSchema,'questionscollection');
